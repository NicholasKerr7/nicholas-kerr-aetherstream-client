import "./Article.scss";
import views from "../../assets/Icons/views.svg";
import likes from "../../assets/Icons/likes.svg";
import { Link } from "react-router-dom";

const formatCompactNumber = (value) =>
  new Intl.NumberFormat("en-US", { notation: "compact" }).format(
    Math.max(0, Number(value) || 0)
  );

function Article({
  currentVideoDetails,
  onToggleCreatorFollow,
  isUpdatingCreatorFollow = false,
  creatorFollowFeedback = "",
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
    </article>
  );
}

export default Article;
