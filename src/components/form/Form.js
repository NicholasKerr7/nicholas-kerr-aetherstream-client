import { useState } from "react";
import "./Form.scss";
import ProImg from "../../assets/images/Mohan-muruge.jpg";

function Form({
  commentCount = 0,
  onSubmitComment,
  isSubmitting = false,
  feedbackMessage = "",
}) {
  const [commentText, setCommentText] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const didSubmit = await onSubmitComment(commentText);

    if (didSubmit) {
      setCommentText("");
    }
  };

  return (
    <section className="form">
      <div className="form__sub-content">
        <h2 className="form__subtitle">
          {commentCount} {commentCount === 1 ? "Transmission" : "Transmissions"}
        </h2>
      </div>
      <div className="form__container">
        <div className="form__img-container">
          <img className="form__pro-img" src={ProImg} alt="Profile img" />
        </div>
        <div className="form__section">
          <div className="form__title-section">
            <h2 className="form__title">Join The Conversation</h2>
            <p className="form__hint">
              Share a thoughtful response with the community.
            </p>
          </div>
          <form className="form__field" onSubmit={handleSubmit}>
            <textarea
              rows={3}
              className="form__input"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Send your signal..."
              required
            />
            <div className="form__footer">
              <p className="form__counter">{commentText.length}/280</p>
              <button
                className="form__btn"
                type="submit"
                disabled={isSubmitting || !commentText.trim()}
              >
                {isSubmitting ? "Posting..." : "Post Signal"}
              </button>
            </div>
          </form>
          {feedbackMessage && <p className="form__feedback">{feedbackMessage}</p>}
        </div>
      </div>
    </section>
  );
}

export default Form;
