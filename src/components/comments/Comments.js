import "./Comments.scss";
import profileImg from "../../assets/images/avatar-640.png";

function Comments({
  comments = [],
  onLikeComment,
  onDeleteComment,
  likingCommentIds = [],
  deletingCommentIds = [],
}) {
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

    return (
      <section key={comment.id} className="comments">
        <div className="comments__img-container">
          <img
            className="comments__pro-img"
            src={profileImg}
            alt="profile img"
          />
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
              onClick={() => onLikeComment(comment.id)}
            >
              {isLiking ? "Liking..." : "Like"}
            </button>
            <button
              className="comments__action-btn comments__action-btn--delete"
              type="button"
              disabled={isDeleting || isLiking}
              onClick={() => onDeleteComment(comment.id)}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </section>
    );
  });
}

export default Comments;
