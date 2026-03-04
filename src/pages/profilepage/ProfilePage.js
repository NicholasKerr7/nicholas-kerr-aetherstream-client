import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAvatarUrl, getInitials } from "../../components/utilities/Utilities";
import "./ProfilePage.scss";

function ProfilePage() {
  const { user, isAuthenticated, updateProfile } = useAuth();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    setName(user.name || "");
    setAvatarUrl(user.avatarUrl || "");
  }, [user]);

  const avatarFallback = useMemo(() => getInitials(name || user?.name || ""), [
    name,
    user,
  ]);

  if (!isAuthenticated) {
    return <Navigate replace to="/auth" />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage("");
    setIsSaving(true);

    try {
      await updateProfile({ name, avatarUrl });
      setStatusMessage("Profile updated.");
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="profile-page">
      <div className="profile-page__card">
        <p className="profile-page__eyebrow">Creator Identity</p>
        <h1 className="profile-page__title">Your Profile</h1>

        <div className="profile-page__avatar-block">
          {getAvatarUrl({ avatarUrl }) ? (
            <img
              className="profile-page__avatar-image"
              src={getAvatarUrl({ avatarUrl })}
              alt={`${name || user.name} avatar`}
            />
          ) : (
            <span className="profile-page__avatar-fallback">{avatarFallback}</span>
          )}
        </div>

        <form className="profile-page__form" onSubmit={handleSubmit}>
          <label className="profile-page__label" htmlFor="profile-name">
            Display Name
          </label>
          <input
            id="profile-name"
            className="profile-page__input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />

          <label className="profile-page__label" htmlFor="profile-avatar-url">
            Avatar URL
          </label>
          <input
            id="profile-avatar-url"
            className="profile-page__input"
            type="url"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            placeholder="https://..."
          />

          <button className="profile-page__save" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
        </form>

        {statusMessage && <p className="profile-page__status">{statusMessage}</p>}
      </div>
    </section>
  );
}

export default ProfilePage;
