import { useEffect, useState } from "react";
import "./Comments.scss";
import { getInitials } from "../utilities/Utilities";

const LikeIcon = () => (
  <svg
    className="comments__action-icon"
    viewBox="0 0 20 20"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M10 17.35 8.55 16.03C4.5 12.36 2 10.09 2 7.31 2 5.04 3.79 3.25 6.06 3.25c1.28 0 2.51.6 3.29 1.54.78-.94 2.01-1.54 3.29-1.54 2.27 0 4.06 1.79 4.06 4.06 0 2.78-2.5 5.05-6.55 8.72z" />
  </svg>
);

const DeleteIcon = () => (
  <svg
    className="comments__action-icon"
    viewBox="0 0 20 20"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M7.25 3.5h5.5m-6.5 2h7.5m-7.1 0 .55 9.15a1 1 0 0 0 1 .94h3.6a1 1 0 0 0 1-.94l.55-9.15M8.9 8.2v4.8m2.2-4.8v4.8" />
  </svg>
);

function Comments({
  comments = [],
  onLikeComment,
  onDeleteComment,
  likingCommentIds = [],
  deletingCommentIds = [],
  currentUserId = "",
  isAuthenticated = false,
  onRequireAuth,
}) {
  const [brokenAvatarCommentIds, setBrokenAvatarCommentIds] = useState([]);

  useEffect(() => {
    setBrokenAvatarCommentIds([]);
  }, [comments]);

  if (!comments.length) {
    return <p className="comments comments--empty">No responses yet.</p>;
  }

  return comments.map((comment) => {
    const date = new Date(comment.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const isLiking = likingCommentIds.includes(comment.id);
    const isDeleting = deletingCommentIds.includes(comment.id);
    const likesCount = Number(comment.likes || 0);
    const commentAvatarUrl = comment.avatarUrl?.trim() || "";
    const showCommentAvatar =
      commentAvatarUrl &&
      !brokenAvatarCommentIds.includes(comment.id);
    const commentInitials = getInitials(comment.name || "");
    const isCommentOwner = Boolean(currentUserId && comment.userId === currentUserId);

    return (
      <section key={comment.id} className="comments">
        <div className="comments__img-container">
          {showCommentAvatar ? (
            <img
              className="comments__pro-img"
              src={commentAvatarUrl}
              alt={`${comment.name} avatar`}
              onError={() =>
                setBrokenAvatarCommentIds((previousIds) =>
                  previousIds.includes(comment.id)
                    ? previousIds
                    : [...previousIds, comment.id]
                )
              }
            />
          ) : (
            <span className="comments__pro-fallback">{commentInitials}</span>
          )}
        </div>
        <div className="comments__container">
          <div className="comments__head-wrapper">
            <h2 className="comments__title">{comment.name}</h2>
            <p className="comments__timestamp">{date}</p>
          </div>
          <div className="comments__field">
            <p className="comments__paragraph">{comment.comment}</p>
          </div>
          <div className="comments__actions">
            <p className="comments__likes">{likesCount} likes</p>
            <button
              className="comments__action-btn comments__action-btn--like"
              type="button"
              disabled={isLiking || isDeleting}
              aria-label="Like comment"
              onClick={() => {
                if (!isAuthenticated) {
                  onRequireAuth();
                  return;
                }

                onLikeComment(comment.id);
              }}
            >
              <LikeIcon />
              <span>{isLiking ? "Liking..." : "Like"}</span>
            </button>
            {isCommentOwner && (
              <button
                className="comments__action-btn comments__action-btn--delete"
                type="button"
                disabled={isDeleting || isLiking}
                aria-label="Delete comment"
                onClick={() => {
                  if (!isAuthenticated) {
                    onRequireAuth();
                    return;
                  }

                  onDeleteComment(comment.id);
                }}
              >
                <DeleteIcon />
                <span>{isDeleting ? "Deleting..." : "Delete"}</span>
              </button>
            )}
          </div>
        </div>
      </section>
    );
  });
}

export default Comments;
