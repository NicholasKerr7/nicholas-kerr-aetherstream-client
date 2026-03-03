import "./Comments.scss";
import profileImg from "../../assets/images/avatar-640.png";

function Comments({ currentVideoDetails }) {
  if (!currentVideoDetails.comments.length) {
    return <p className="comments comments--empty">No responses yet.</p>;
  }

  return currentVideoDetails.comments.map((comment) => {
    const date = new Date(comment.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

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
        </div>
      </section>
    );
  });
}

export default Comments;
