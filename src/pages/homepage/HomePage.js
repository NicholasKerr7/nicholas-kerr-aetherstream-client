// importing components folders into Homepage
import Hero from "../../components/Hero/Hero";
import Article from "../../components/Article/Article";
import Form from "../../components/Form/Form";
import Comments from "../../components/Comments/Comments";
import Playlist from "../../components/Playlist/Playlist";
import { API_URL, API_KEY } from "../../components/Utilities/Utilities";
import "./HomePage.scss";

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
  }, [videoId]);

  useEffect(() => {

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
      <Hero currentVideoDetails={currentVideoDetails} />
      <div className="App__container">
        <div className="App__description">
        <Article currentVideoDetails={currentVideoDetails} />
        <Form />
        <Comments currentVideoDetails={currentVideoDetails} />
        </div>
        <div className="App__playlist">
          <Playlist
            currentVideoDetails={currentVideoDetails}
            playlist={playlist}
          />
        </div>
      </div>
    </div>
  );
}

export default HomePage;
