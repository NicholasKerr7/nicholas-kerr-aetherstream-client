import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AuthPage.scss";

const initialFormState = {
  name: "",
  email: "",
  password: "",
  avatarUrl: "",
};

function AuthPage() {
  const { login, signup, isAuthenticated } = useAuth();
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (isAuthenticated) {
    return <Navigate replace to="/" />;
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const toggleMode = () => {
    setMode((previousMode) => (previousMode === "login" ? "signup" : "login"));
    setErrorMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        await signup({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          avatarUrl: formData.avatarUrl,
        });
      }
      setFormData(initialFormState);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-page__card">
        <p className="auth-page__eyebrow">AetherStream Access</p>
        <h1 className="auth-page__title">
          {mode === "login" ? "Welcome Back" : "Create Your Account"}
        </h1>
        <p className="auth-page__copy">
          {mode === "login"
            ? "Sign in to upload videos, post signals, and manage your profile."
            : "Create a profile with an avatar and start publishing on AetherStream."}
        </p>

        <form className="auth-page__form" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <label className="auth-page__label" htmlFor="name">
                Display Name
              </label>
              <input
                id="name"
                className="auth-page__input"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your creator name"
                required
              />

              <label className="auth-page__label" htmlFor="avatarUrl">
                Avatar URL (optional)
              </label>
              <input
                id="avatarUrl"
                className="auth-page__input"
                name="avatarUrl"
                type="url"
                value={formData.avatarUrl}
                onChange={handleInputChange}
                placeholder="https://..."
              />
            </>
          )}

          <label className="auth-page__label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="auth-page__input"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="you@example.com"
            required
          />

          <label className="auth-page__label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="auth-page__input"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Minimum 8 characters"
            minLength={8}
            required
          />

          <button className="auth-page__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Processing..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        {errorMessage && <p className="auth-page__error">{errorMessage}</p>}

        <button className="auth-page__switch" type="button" onClick={toggleMode}>
          {mode === "login"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </section>
  );
}

export default AuthPage;
