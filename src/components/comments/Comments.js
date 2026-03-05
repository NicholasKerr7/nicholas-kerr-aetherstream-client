import { useEffect, useMemo, useState } from "react";
import "./Comments.scss";
import { getInitials } from "../utilities/Utilities";

const getCommentReplies = (comment = {}) =>
  Array.isArray(comment.replies) ? comment.replies : [];

const flattenThreadCommentIds = (comments = []) =>
  comments.flatMap((comment) => [
    comment.id,
    ...flattenThreadCommentIds(getCommentReplies(comment)),
  ]);

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

const ReplyIcon = () => (
  <svg
    className="comments__action-icon"
    viewBox="0 0 20 20"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M10.2 5.5 4.5 10l5.7 4.5M5.2 10h6.1c2.1 0 3.7 1.7 3.7 3.8v.7" />
  </svg>
);

function Comments({
  comments = [],
  onLikeComment,
  onReplyComment,
  onDeleteComment,
  likingCommentIds = [],
  deletingCommentIds = [],
  replyingToCommentId = "",
  onSetReplyingToCommentId = () => {},
  isPostingComment = false,
  currentUserId = "",
  isAuthenticated = false,
  onRequireAuth,
}) {
  const [brokenAvatarCommentIds, setBrokenAvatarCommentIds] = useState([]);
  const [collapsedCommentIds, setCollapsedCommentIds] = useState([]);
  const [replyTextByCommentId, setReplyTextByCommentId] = useState({});
  const likingCommentIdSet = useMemo(
    () => new Set(likingCommentIds),
    [likingCommentIds]
  );
  const deletingCommentIdSet = useMemo(
    () => new Set(deletingCommentIds),
    [deletingCommentIds]
  );

  useEffect(() => {
    const validCommentIds = new Set(flattenThreadCommentIds(comments));

    setBrokenAvatarCommentIds((previousIds) =>
      previousIds.filter((commentId) => validCommentIds.has(commentId))
    );
    setCollapsedCommentIds((previousIds) =>
      previousIds.filter((commentId) => validCommentIds.has(commentId))
    );
    setReplyTextByCommentId((previousTexts) =>
      Object.fromEntries(
        Object.entries(previousTexts).filter(([commentId]) =>
          validCommentIds.has(commentId)
        )
      )
    );

    if (replyingToCommentId && !validCommentIds.has(replyingToCommentId)) {
      onSetReplyingToCommentId("");
    }
  }, [comments, onSetReplyingToCommentId, replyingToCommentId]);

  if (!comments.length) {
    return <p className="comments comments--empty">No responses yet.</p>;
  }

  const toggleThreadCollapsed = (commentId) => {
    setCollapsedCommentIds((previousIds) =>
      previousIds.includes(commentId)
        ? previousIds.filter((id) => id !== commentId)
        : [...previousIds, commentId]
    );
  };

  const renderCommentThread = (comment, depth = 0) => {
    const replies = getCommentReplies(comment);
    const hasReplies = replies.length > 0;
    const isCollapsed = collapsedCommentIds.includes(comment.id);
    const date = new Date(comment.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const isLiking = likingCommentIdSet.has(comment.id);
    const isDeleting = deletingCommentIdSet.has(comment.id);
    const likesCount = Number(comment.likes || 0);
    const commentAvatarUrl = comment.avatarUrl?.trim() || "";
    const showCommentAvatar =
      commentAvatarUrl && !brokenAvatarCommentIds.includes(comment.id);
    const commentInitials = getInitials(comment.name || "");
    const isCommentOwner = Boolean(currentUserId && comment.userId === currentUserId);
    const isReplying = replyingToCommentId === comment.id;
    const replyText = replyTextByCommentId[comment.id] || "";

    return (
      <article
        key={comment.id}
        className={`comments__item ${depth ? "comments__item--nested" : ""}`}
      >
        <div className="comments__item-main">
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
                aria-label={comment.likedByCurrentUser ? "Unlike comment" : "Like comment"}
                onClick={() => {
                  if (!isAuthenticated) {
                    onRequireAuth();
                    return;
                  }

                  onLikeComment(comment.id);
                }}
              >
                <LikeIcon />
                <span>
                  {isLiking
                    ? "Saving..."
                    : comment.likedByCurrentUser
                      ? "Unlike"
                      : "Like"}
                </span>
              </button>
              <button
                className="comments__action-btn comments__action-btn--reply"
                type="button"
                disabled={isDeleting}
                aria-label={isReplying ? "Cancel reply" : "Reply to comment"}
                onClick={() => {
                  if (!isAuthenticated) {
                    onRequireAuth();
                    return;
                  }

                  onSetReplyingToCommentId(isReplying ? "" : comment.id);
                }}
              >
                <ReplyIcon />
                <span>{isReplying ? "Cancel" : "Reply"}</span>
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
              {hasReplies && (
                <button
                  className="comments__thread-toggle"
                  type="button"
                  aria-label={isCollapsed ? "Expand replies" : "Collapse replies"}
                  onClick={() => toggleThreadCollapsed(comment.id)}
                >
                  {isCollapsed
                    ? `Show ${replies.length} ${replies.length === 1 ? "reply" : "replies"}`
                    : "Hide replies"}
                </button>
              )}
            </div>
            {isReplying && (
              <form
                className="comments__reply-form"
                onSubmit={async (event) => {
                  event.preventDefault();

                  if (!isAuthenticated) {
                    onRequireAuth();
                    return;
                  }

                  if (!replyText.trim()) {
                    return;
                  }

                  const didSubmit = await onReplyComment(comment.id, replyText);

                  if (!didSubmit) {
                    return;
                  }

                  setReplyTextByCommentId((previousTexts) => ({
                    ...previousTexts,
                    [comment.id]: "",
                  }));
                  onSetReplyingToCommentId("");
                  setCollapsedCommentIds((previousIds) =>
                    previousIds.filter((id) => id !== comment.id)
                  );
                }}
              >
                <textarea
                  className="comments__reply-input"
                  rows={2}
                  value={replyText}
                  onChange={(event) =>
                    setReplyTextByCommentId((previousTexts) => ({
                      ...previousTexts,
                      [comment.id]: event.target.value,
                    }))
                  }
                  placeholder={
                    isAuthenticated
                      ? `Reply to ${comment.name}...`
                      : "Sign in to reply"
                  }
                  required
                  disabled={!isAuthenticated || isPostingComment || isDeleting}
                />
                <div className="comments__reply-actions">
                  <button
                    className="comments__reply-btn comments__reply-btn--submit"
                    type="submit"
                    disabled={
                      !isAuthenticated ||
                      isPostingComment ||
                      isDeleting ||
                      !replyText.trim()
                    }
                  >
                    {isPostingComment ? "Posting..." : "Post reply"}
                  </button>
                  <button
                    className="comments__reply-btn comments__reply-btn--cancel"
                    type="button"
                    disabled={isPostingComment}
                    onClick={() => onSetReplyingToCommentId("")}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        {hasReplies && !isCollapsed && (
          <div className="comments__children">
            {replies.map((reply) => renderCommentThread(reply, depth + 1))}
          </div>
        )}
      </article>
    );
  };

  return <section className="comments">{comments.map((comment) => renderCommentThread(comment))}</section>;
}

export default Comments;
