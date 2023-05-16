import "./Hero.scss";
import playBtn from "../../../assets/Icons/play.svg";
import scrubBar from "../../../assets/Icons/scrub.svg";
import fullScreen from "../../../assets/Icons/fullscreen.svg";
import volumeUp from "../../../assets/Icons/volume_up.svg";
// import tumbnailVideo from "../../../data/video-details.json";

function Hero() {
  return (
    <hero className="hero" >
      <div className="hero__tumbnail">
        <img className="hero__video" src="https://i.imgur.com/l2Xfgpl.jpg" alt="video tumbnail" />
      </div>
      <div className="hero__btn">
        <img className="hero__btn-img" src={playBtn} alt="play button" />
        <img className="hero__btn-img" src={scrubBar} alt="scrub tab" />
        <img className="hero__btn-img" src={fullScreen} alt="full screen" />
        <img className="hero__btn-img" src={volumeUp} alt="volume button" />
      </div>
    </hero>
  );
}
export default Hero;
