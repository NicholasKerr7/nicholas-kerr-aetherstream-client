import "./Comments.scss";
import profileImg from "../../assets/images/avatar-640.png";

function Comments({ currentVideo }) {
  return currentVideo.comments.map((comment) => {
    const timestamp = new Date(comment.timestamp).toLocaleDateString();
    return (
      <section className="comments">
        <div className="comments__img-container">
          <img className="comments__pro-img" src={profileImg} alt="profile img" />
        </div>
        <div className="comments__container">
        <div className="comments__head-wrapper">
          <h2 className="comments__title">{comment.name}</h2>
          <p className="comment__timestamp">{timestamp}</p>
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
