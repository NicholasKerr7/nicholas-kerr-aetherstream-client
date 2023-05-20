import "./Playlist.scss";

function Playlist({ currentVideo, playlist, changeCurrentVideos }) {
  const fileredVideos = playlist.filter(
    (video) => currentVideo.id !== video.id
  );

  return (
    <section className="playlist">
        <h2 className="playlist__title">NEXT VIDEOS</h2>
      {" "}
      {fileredVideos.map((video) => {
        return (
          <div
            key={video.id}
            onClick={() => {
              changeCurrentVideos(video.id);
            }}
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
          </div>
        );
      })}
    </section>
  );
}
export default Playlist;
