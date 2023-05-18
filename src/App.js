
import "./App.scss";

// importing components folders
import Header from "./components/header/Header";
import Hero from "./components/hero/Hero";
import Article from "./components/article/Article";
import Form from "./components/form/Form";
import Comments from "./components/comments/Comments";

// importing json file to be used in various folders 
import videos from "./data/video-details.json"

// import selectVideos from "./data/videos.json";
import { useState } from "react";


function App() {

  const [currentVideo, setcurrentVideo] = useState(videos[0]);
  // const [activeVideo, setactiveVideo] useState(data);



  function currentVideoa (){}

  return (
    <div className="App">
      <Header />
      <Hero currentVideo={currentVideo}/>
      <Article currentVideo={currentVideo} />
      <Form />
      <Comments currentVideo={currentVideo}/>
      {/* <Aside activeVideo={activeVideo}/> */}

    </div>
  );
}

export default App;
