import "./App.scss";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  Link,
} from "react-router-dom";
import { useState } from "react";
import HomePage from "./pages/homepage/HomePage";
import UploadPage from "./pages/uploadpage/UploadPage";
import AuthPage from "./pages/authpage/AuthPage";
import ProfilePage from "./pages/profilepage/ProfilePage";
import Header from "./components/header/Header";
import { useAuth } from "./context/AuthContext";

const NotFound = () => (
  <section className="app__not-found">
    <p className="app__not-found-label">404</p>
    <h1 className="app__not-found-title">Signal Not Found</h1>
    <p className="app__not-found-copy">
      The page you requested does not exist in this stream.
    </p>
    <Link className="app__not-found-link" to="/">
      Return to AetherStream
    </Link>
  </section>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <section className="app__status-panel">
        <p className="app__status-text">Authorizing secure channel...</p>
      </section>
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/auth" />;
  }

  return children;
};

const App = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="app">
      <BrowserRouter>
        <div className="app__ambient-glow" aria-hidden="true" />
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <main className="app__main">
          <Routes>
            <Route path="/" element={<HomePage searchQuery={searchQuery} />} />
            <Route
              path="/videos/:videoId"
              element={<HomePage searchQuery={searchQuery} />}
            />
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/studio/upload"
              element={
                <ProtectedRoute>
                  <UploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/UploadPage"
              element={<Navigate replace to="/studio/upload" />}
            />
            <Route path="/upload" element={<Navigate replace to="/studio/upload" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
};

export default App;
