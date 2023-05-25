// importing components folders
import Header from "../../components/header/Header";
import Hero from "../../components/hero/Hero";
import Article from "../../components/article/Article";
import Form from "../../components/form/Form";
import Comments from "../../components/comments/Comments";
import Playlist from "../../components/playlist/Playlist";
import { API_URL, API_KEY } from "../../components/utilities/Utilities";

import axios from "axios";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

function HomePage() {
  const [playlist, setPlaylist] = useState([]);
  const [currentVideoDetails, setcurrentVideoDetails] = useState(null);
  const { videoId } = useParams();

  const getVideoById = (id) => {
    axios
      .get(`${API_URL}videos/${id}${API_KEY}`)
      .then((response) => {
        setcurrentVideoDetails(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    // We're on the HOMEPAGE
    // 1. Get all videos
    // 2. Also the full details (with comments) using the FIRST video
    axios
      .get(`${API_URL}videos${API_KEY}`)
      .then((response) => {
        setPlaylist(response.data);

        if (!videoId) {
          getVideoById(response.data[0].id);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  useEffect(() => {
    // We're on the SINGLE VIDEO PAGE

    // If the URL doesn't have ID, stop...
    if (!videoId) {
      return;
    }

    // Get the full details (with comments) for the video with an id of whatever is in the URL
    getVideoById(videoId);
  }, [videoId]);

  if (!currentVideoDetails) {
    return;
  }

  return (
    <div className="App">
      <Header />
      <Hero currentVideoDetails={currentVideoDetails} />
      <Article currentVideoDetails={currentVideoDetails} />
      <Form />
      <Comments currentVideoDetails={currentVideoDetails} />
      <Playlist currentVideoDetails={currentVideoDetails} playlist={playlist} />
    </div>
  );
}

export default HomePage;
