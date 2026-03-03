import "./Header.scss";
import profileImg from "../../assets/images/Mohan-muruge.jpg";
import searchIcon from "../../assets/Icons/search.svg";
import { Link } from "react-router-dom";

function Header({ searchQuery, onSearchChange }) {
  return (
    <header className="header">
      <Link to="/" className="header__brand">
        <span className="header__brand-mark">A</span>
        <div>
          <p className="header__brand-name">AetherStream</p>
          <p className="header__brand-tag">Immersive Video Intelligence</p>
        </div>
      </Link>
      <div className="header__controls">
        <label className="header__search" htmlFor="video-search">
          <img className="header__search-icon" src={searchIcon} alt="" />
          <input
            id="video-search"
            className="header__search-bar"
            type="search"
            name="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search titles or creators"
          />
        </label>
        <Link to="/studio/upload" className="header__studio-btn">
          Launch Studio
        </Link>
        <img className="header__pro-img" src={profileImg} alt="profile img" />
      </div>
    </header>
  );
}

export default Header;
