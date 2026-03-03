import "./App.scss";
import { BrowserRouter, Navigate, Route, Routes, Link } from "react-router-dom";
import { useState } from "react";
import HomePage from "./pages/homepage/HomePage";
import UploadPage from "./pages/uploadpage/UploadPage";
import Header from "./components/header/Header";

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
            <Route path="/studio/upload" element={<UploadPage />} />
            <Route
              path="/UploadPage"
              element={<Navigate replace to="/studio/upload" />}
            />
            <Route
              path="/upload"
              element={<Navigate replace to="/studio/upload" />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
};

export default App;
