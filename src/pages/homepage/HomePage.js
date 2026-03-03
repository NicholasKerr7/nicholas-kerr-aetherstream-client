import Hero from "../../components/hero/Hero";
import Article from "../../components/article/Article";
import Form from "../../components/form/Form";
import Comments from "../../components/comments/Comments";
import Playlist from "../../components/playlist/Playlist";
import { API_URL } from "../../components/utilities/Utilities";
import "./HomePage.scss";

import axios from "axios";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";

function HomePage({ searchQuery }) {
  const [playlist, setPlaylist] = useState([]);
  const [currentVideoDetails, setcurrentVideoDetails] = useState(null);
  const { videoId } = useParams();

  const getVideoById = useCallback((id) => {
    axios
      .get(`${API_URL}videos/${id}`)
      .then((response) => {
        setcurrentVideoDetails(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  useEffect(() => {
    axios
      .get(`${API_URL}videos`)
      .then((response) => {
        setPlaylist(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  useEffect(() => {
    if (!playlist.length) {
      return;
    }

    const activeVideoId = videoId || playlist[0].id;
    getVideoById(activeVideoId);
  }, [getVideoById, videoId, playlist]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const activeVideoId = currentVideoDetails ? currentVideoDetails.id : null;

  const filteredPlaylist = useMemo(
    () =>
      playlist.filter((video) => {
        const isActive = activeVideoId === video.id;
        if (isActive) {
          return false;
        }
        if (!normalizedQuery) {
          return true;
        }
        const searchableContent = `${video.title} ${video.channel}`.toLowerCase();
        return searchableContent.includes(normalizedQuery);
      }),
    [playlist, activeVideoId, normalizedQuery]
  );

  if (!currentVideoDetails) {
    return (
      <main className="home home--loading">
        <p className="home__status">Syncing cinematic feed...</p>
      </main>
    );
  }

  return (
    <main className="home">
      <Hero currentVideoDetails={currentVideoDetails} />
      <div className="home__grid">
        <section className="home__primary">
          <Article currentVideoDetails={currentVideoDetails} />
          <Form commentCount={currentVideoDetails.comments.length} />
          <Comments currentVideoDetails={currentVideoDetails} />
        </section>
        <aside className="home__rail">
          <Playlist
            currentVideoDetails={currentVideoDetails}
            playlist={filteredPlaylist}
            searchQuery={searchQuery}
          />
        </aside>
      </div>
    </main>
  );
}

export default HomePage;
