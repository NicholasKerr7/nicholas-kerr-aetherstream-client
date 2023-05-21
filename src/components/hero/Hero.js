import "./Hero.scss";

function Hero ({ currentVideoDetails }) {
  return (
    <section className="hero">
      <div>
        <video
          className="hero__tumbnail"
          src=""
          poster={currentVideoDetails.image}
          controls
        ></video>
      </div>
    </section>
  );
}
export default Hero;
