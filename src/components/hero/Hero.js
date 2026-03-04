import "./Hero.scss";

function Hero({ currentVideoDetails }) {
  const commentCount = currentVideoDetails.comments.length;

  return (
    <section className="hero">
      <div className="hero__container">
        <video
          className="hero__video"
          src={currentVideoDetails.video}
          poster={currentVideoDetails.image}
          preload="metadata"
          controls
        />
        <div className="hero__overlay">
          <p className="hero__eyebrow">Now Streaming</p>
          <h2 className="hero__title">{currentVideoDetails.title}</h2>
          <div className="hero__chips">
            <span className="hero__chip">{currentVideoDetails.channel}</span>
            <span className="hero__chip">{currentVideoDetails.views} views</span>
            <span className="hero__chip">
              {commentCount} {commentCount === 1 ? "response" : "responses"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
export default Hero;
