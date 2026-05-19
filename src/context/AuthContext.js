import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import {
  API_URL,
  TOKEN_STORAGE_KEY,
  getAuthHeaders,
} from "../components/utilities/Utilities";

const AuthContext = createContext(null);

const getErrorMessage = (error, fallbackMessage) =>
  error.response?.data?.message || fallbackMessage;

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      if (!token) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}auth/me`, {
          headers: getAuthHeaders(token),
        });
        setUser(response.data);
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken("");
        setUser(null);
      } finally {
        setIsBootstrapping(false);
      }
    };

    bootstrapAuth();
  }, [token]);

  const setAuthSession = (nextToken, nextUser) => {
    if (nextToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }

    setToken(nextToken || "");
    setUser(nextUser || null);
  };

  const signup = async ({ name, email, password, avatarUrl }) => {
    try {
      const response = await axios.post(`${API_URL}auth/signup`, {
        name,
        email,
        password,
        avatarUrl,
      });

      setAuthSession(response.data.token, response.data.user);
      return response.data.user;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Could not create account."));
    }
  };

  const login = async ({ email, password }) => {
    try {
      const response = await axios.post(`${API_URL}auth/login`, {
        email,
        password,
      });

      setAuthSession(response.data.token, response.data.user);
      return response.data.user;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Could not sign in."));
    }
  };

  const adminLogin = async () => {
    try {
      const response = await axios.post(`${API_URL}auth/admin-login`);

      setAuthSession(response.data.token, response.data.user);
      return response.data.user;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Could not sign in as admin."));
    }
  };

  const logout = () => {
    setAuthSession("", null);
  };

  const refreshProfile = async () => {
    if (!token) {
      return null;
    }

    try {
      const response = await axios.get(`${API_URL}auth/me`, {
        headers: getAuthHeaders(token),
      });

      setUser(response.data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Could not load profile."));
    }
  };

  const updateProfile = async ({ name, avatarUrl }) => {
    if (!token) {
      throw new Error("You need to be signed in.");
    }

    try {
      const response = await axios.patch(
        `${API_URL}auth/me`,
        {
          name,
          avatarUrl,
        },
        {
          headers: getAuthHeaders(token),
        }
      );

      setUser(response.data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Could not update profile."));
    }
  };

  const contextValue = {
    token,
    user,
    isAuthenticated: Boolean(token && user),
    isBootstrapping,
    signup,
    login,
    adminLogin,
    logout,
    refreshProfile,
    updateProfile,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return authContext;
};
