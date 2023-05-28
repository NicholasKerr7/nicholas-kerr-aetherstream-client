import "./App.scss";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Homepage/HomePage";
import UploadPage from "./pages/Uploadpage/UploadPage";
import Header from "./components/Header/Header";

const App = () => {
  return (
    <div className="app">
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/videos/:videoId" element={<HomePage />} />
          <Route path="UploadPage" element={<UploadPage />} />
          <Route path="*" element={<p>No video with that id exists</p>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
