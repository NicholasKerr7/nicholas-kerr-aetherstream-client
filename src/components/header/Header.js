import { useEffect, useMemo, useState } from "react";
import "./Header.scss";
import searchIcon from "../../assets/Icons/search.svg";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAvatarUrl, getInitials } from "../utilities/Utilities";

function Header({ searchQuery, onSearchChange }) {
  const { isAuthenticated, user, logout } = useAuth();
  const [avatarBroken, setAvatarBroken] = useState(false);

  const avatarUrl = getAvatarUrl(user);
  const initials = useMemo(() => getInitials(user?.name || ""), [user]);

  useEffect(() => {
    setAvatarBroken(false);
  }, [avatarUrl]);

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

        {isAuthenticated ? (
          <div className="header__auth-controls">
            <Link to="/profile" className="header__profile-pill">
              {avatarUrl && !avatarBroken ? (
                <img
                  className="header__pro-img"
                  src={avatarUrl}
                  alt={`${user.name} avatar`}
                  onError={() => setAvatarBroken(true)}
                />
              ) : (
                <span className="header__pro-fallback">{initials}</span>
              )}
              <span className="header__profile-name">{user.name}</span>
            </Link>
            <button className="header__logout-btn" type="button" onClick={logout}>
              Log Out
            </button>
          </div>
        ) : (
          <Link to="/auth" className="header__auth-btn">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}

export default Header;
