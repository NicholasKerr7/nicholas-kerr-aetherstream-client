import "./Hero.scss";

function Hero ({ currentVideo }) {
  return (
    <section className="hero">
      <div>
        <video
          className="hero__tumbnail"
          src=""
          poster={currentVideo.image}
          controls
        ></video>
      </div>
    </section>
  );
}
export default Hero;
