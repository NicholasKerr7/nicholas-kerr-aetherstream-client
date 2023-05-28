import "./Header.scss";
import brainflixLogo from "../../assets/logo/BrainFlix-logo.svg";
import profileImg from "../../assets/images/Mohan-muruge.jpg";
import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="header">
      <Link to="/" className="header__logo-container">
        <img
          className="header__site-logo"
          src={brainflixLogo}
          alt="BrainFlix-logo"
        />
      </Link>
      <div className="header__search">
        <input
          className="header__search-bar"
          type="text"
          name="search"
          placeholder="Search"
        />
        <img className="header__pro-img" src={profileImg} alt="profile img" />
        <Link to= "UploadPage" className="header__btn">UPLOAD</Link>
      </div>
    </header>
  );
}

export default Header;
