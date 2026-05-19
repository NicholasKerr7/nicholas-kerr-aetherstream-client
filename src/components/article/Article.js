import "./Article.scss";
import views from "../../assets/Icons/views.svg";
import likes from "../../assets/Icons/likes.svg";
import { Link } from "react-router-dom";

const formatCompactNumber = (value) =>
  new Intl.NumberFormat("en-US", { notation: "compact" }).format(
    Math.max(0, Number(value) || 0)
  );

const LikeIcon = () => (
  <svg
    className="article__action-icon"
    viewBox="0 0 20 20"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M10 17.35 8.55 16.03C4.5 12.36 2 10.09 2 7.31 2 5.04 3.79 3.25 6.06 3.25c1.28 0 2.51.6 3.29 1.54.78-.94 2.01-1.54 3.29-1.54 2.27 0 4.06 1.79 4.06 4.06 0 2.78-2.5 5.05-6.55 8.72z" />
  </svg>
);

const SaveIcon = () => (
  <svg
    className="article__action-icon"
    viewBox="0 0 20 20"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M5.5 3.5h9v13L10 13.6 5.5 16.5z" />
  </svg>
);

const ShareIcon = () => (
  <svg
    className="article__action-icon"
    viewBox="0 0 20 20"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M7.5 10.2 12.6 7M7.5 10.2l5.1 3.2M6 12.6a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Zm8-5.1a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Zm0 9.8a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z" />
  </svg>
);

function Article({
  currentVideoDetails,
  onToggleCreatorFollow,
  onToggleVideoLike,
  onToggleVideoSave,
  onShareVideo,
  isUpdatingCreatorFollow = false,
  isUpdatingVideoLike = false,
  isUpdatingVideoSave = false,
  creatorFollowFeedback = "",
  videoActionFeedback = "",
  currentUserId = "",
}) {
  const date = new Date(currentVideoDetails.timestamp).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );
  const isOwnCreator = Boolean(
    currentUserId && currentVideoDetails.creatorId === currentUserId
  );
  const isFollowingCreator = Boolean(
    currentVideoDetails.isCreatorFollowedByCurrentUser
  );
  const creatorFollowersCount = formatCompactNumber(
    currentVideoDetails.creatorFollowersCount || 0
  );
  const likeActionClassName = [
    "article__action-btn",
    currentVideoDetails.isLikedByCurrentUser ? "article__action-btn--active" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const saveActionClassName = [
    "article__action-btn",
    currentVideoDetails.isSavedByCurrentUser ? "article__action-btn--active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article key={currentVideoDetails.id} className="article">
      <div className="article__top">
        <div className="article__heading">
          <h1 className="article__title">{currentVideoDetails.title}</h1>
          <div className="article__meta">
            {currentVideoDetails.creatorId ? (
              <Link
                className="article__author article__author-link"
                to={`/creators/${currentVideoDetails.creatorId}`}
              >
                By {currentVideoDetails.channel}
              </Link>
            ) : (
              <p className="article__author">By {currentVideoDetails.channel}</p>
            )}
            <p className="article__date">{date}</p>
            {currentVideoDetails.creatorId && (
              <p className="article__followers">
                {creatorFollowersCount} followers
              </p>
            )}
            {!isOwnCreator && currentVideoDetails.creatorId && (
              <button
                className={`article__follow-btn ${isFollowingCreator ? "article__follow-btn--active" : ""}`}
                type="button"
                disabled={isUpdatingCreatorFollow}
                onClick={onToggleCreatorFollow}
              >
                {isUpdatingCreatorFollow
                  ? "Updating..."
                  : isFollowingCreator
                    ? "Following"
                    : "Follow"}
              </button>
            )}
          </div>
          {creatorFollowFeedback && (
            <p className="article__follow-feedback">{creatorFollowFeedback}</p>
          )}
        </div>
        <div className="article__metrics">
          <div className="article__metric">
            <img className="article__metric-icon" src={views} alt="views" />
            <div>
              <p className="article__metric-label">Views</p>
              <p className="article__metric-value">{currentVideoDetails.views}</p>
            </div>
          </div>
          <div className="article__metric">
            <img className="article__metric-icon" src={likes} alt="likes" />
            <div>
              <p className="article__metric-label">Likes</p>
              <p className="article__metric-value">{currentVideoDetails.likes}</p>
            </div>
          </div>
        </div>
      </div>
      <p className="article__description">{currentVideoDetails.description}</p>
      <div className="article__actions" aria-label="Video actions">
        <button
          className={likeActionClassName}
          type="button"
          disabled={isUpdatingVideoLike}
          onClick={onToggleVideoLike}
        >
          <LikeIcon />
          <span>
            {isUpdatingVideoLike
              ? "Saving..."
              : currentVideoDetails.isLikedByCurrentUser
                ? "Liked"
                : "Like"}
          </span>
        </button>
        <button
          className={saveActionClassName}
          type="button"
          disabled={isUpdatingVideoSave}
          onClick={onToggleVideoSave}
        >
          <SaveIcon />
          <span>
            {isUpdatingVideoSave
              ? "Saving..."
              : currentVideoDetails.isSavedByCurrentUser
                ? "Saved"
                : "Save"}
          </span>
        </button>
        <button className="article__action-btn" type="button" onClick={onShareVideo}>
          <ShareIcon />
          <span>Share</span>
        </button>
      </div>
      {videoActionFeedback && (
        <p className="article__action-feedback">{videoActionFeedback}</p>
      )}
    </article>
  );
}

export default Article;
