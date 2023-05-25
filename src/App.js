import "./App.scss";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/homepage/HomePage";
import UploadPage from "./pages/uploadpage/UploadPage";

// importing json files to be used in various folders
// import videos from "./data/video-details.json";
// import playlist from "./data/videos.json";

const App = () => {
  return (
    <div className="app">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/videos/:videoId" element={<HomePage />} />
          <Route path="UploadPage" element={<UploadPage />} />
          <Route path="*" element={"No video with that id exists"} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
