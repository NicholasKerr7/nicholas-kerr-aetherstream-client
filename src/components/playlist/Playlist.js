import { Link } from "react-router-dom";
import "./Playlist.scss";

function Playlist({ currentVideoDetails, playlist }) {
  const filteredVideos = playlist.filter(
    (video) => currentVideoDetails.id !== video.id
  );

  return (
    <section className="playlist">
      <h2 className="playlist__title">NEXT VIDEOS</h2>

      {filteredVideos.map((video) => {
        return (
          <Link
            to={`/videos/${video.id}`}
            key={video.id}
           
            className="playlist__container"
          >
            <div className="playlist__video-container">
              <img
                className="playlist__video"
                src={video.image}
                alt="next videos"
              />
            </div>
            <div className="playlist__text-container">
              <h2 className="playlist__subtitle">{video.title}</h2>
              <p className="playlist__author">{video.channel}</p>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
export default Playlist;
