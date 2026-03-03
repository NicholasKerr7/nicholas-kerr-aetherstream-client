import { Link } from "react-router-dom";
import "./Playlist.scss";

function Playlist({ currentVideoDetails, playlist, searchQuery }) {
  const filteredVideos = playlist.filter(
    (video) => currentVideoDetails.id !== video.id
  );

  return (
    <section className="playlist">
      <div className="playlist__header">
        <h2 className="playlist__title">Up Next</h2>
        <p className="playlist__hint">
          {searchQuery
            ? `Filtered by "${searchQuery.trim()}"`
            : "Curated for your queue"}
        </p>
      </div>

      {!filteredVideos.length && (
        <p className="playlist__empty">
          No videos matched this search. Try a different keyword.
        </p>
      )}

      {filteredVideos.map((video, index) => {
        return (
          <Link
            to={`/videos/${video.id}`}
            key={video.id}
            className="playlist__container"
          >
            <p className="playlist__index">{String(index + 1).padStart(2, "0")}</p>
            <div className="playlist__video-container">
              <img
                className="playlist__video"
                src={video.image ? video.image : currentVideoDetails.image}
                alt={video.title}
              />
            </div>
            <div className="playlist__text-container">
              <h3 className="playlist__subtitle">{video.title}</h3>
              <p className="playlist__author">{video.channel}</p>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
export default Playlist;
