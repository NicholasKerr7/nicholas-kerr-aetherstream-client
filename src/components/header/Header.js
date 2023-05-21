import "./Header.scss";
import brainflixLogo from "../../assets/logo/BrainFlix-logo.svg";
import searchIcon from "../../assets/Icons/search.svg";
import profileImg from "../../assets/images/Mohan-muruge.jpg";
import uploadIcon from "../../assets/Icons/upload.svg";
function Header() {
  return (
    <header className="header">
      <span className="header__logo-container">
        <img className="header__site-logo" src={brainflixLogo} alt="BrainFlix-logo" />
      </span>
      <div className="header__search">
        <img
          className="header__search-icon"
          src={searchIcon}
          alt="search btn"
        />
        <input
          className="header__search-bar"
          type="text"
          name="search"
          placeholder="Search"
        />
        <img className="header__pro-img" src={profileImg} alt="profile img" />
      </div>
      <div className="header__btn-container">
        <img className="header__btn-icon" src={uploadIcon} alt="upload icon" />
        <button className="header__btn">UPLOAD</button>
      </div>
    </header>
  );
}

export default Header;
