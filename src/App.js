import "./App.scss";

// importing components folders
import Header from "./components/header/Header";
import Hero from "./components/hero/Hero";
import Article from "./components/article/Article";
import Form from "./components/form/Form";
import Comments from "./components/comments/Comments";
import Playlist from "./components/playlist/Playlist";

// importing json file to be used in various folders
import videos from "./data/video-details.json";
import playlist from "./data/videos.json";

import { useState } from "react";

function App() {
  const [currentVideoDetails, setcurrentVideoDetails] = useState(videos[0]);
  // const [currentVideo, setcurrentVideo] = useState(playlist[0]);

  function changeCurrentVideos(videoId) {
// const newVideo = videos.filter((video) => video.id===videoId)
const index = videos.findIndex((video)=> video.id===videoId)
setcurrentVideoDetails(videos[index])


  }

  return (
    <div className="App">
      <Header />
      <Hero currentVideo={currentVideoDetails} />
      <Article currentVideoDetails={currentVideoDetails} />
      <Form />
      <Comments currentVideoDetails={currentVideoDetails} />
      <Playlist changeCurrentVideos={changeCurrentVideos} currentVideo={currentVideoDetails} playlist={playlist} />
    </div>
  );
}

export default App;
