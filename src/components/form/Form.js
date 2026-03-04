import { useEffect, useMemo, useState } from "react";
import "./Form.scss";
import { useAuth } from "../../context/AuthContext";
import { getAvatarUrl, getInitials } from "../utilities/Utilities";

function Form({
  commentCount = 0,
  onSubmitComment,
  isSubmitting = false,
  feedbackMessage = "",
  isAuthenticated = false,
  onRequireAuth,
}) {
  const [commentText, setCommentText] = useState("");
  const [avatarBroken, setAvatarBroken] = useState(false);
  const { user } = useAuth();
  const avatarUrl = getAvatarUrl(user);
  const avatarInitials = useMemo(() => getInitials(user?.name || ""), [user]);

  useEffect(() => {
    setAvatarBroken(false);
  }, [avatarUrl]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

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
          {avatarUrl && !avatarBroken ? (
            <img
              className="form__pro-img"
              src={avatarUrl}
              alt={`${user?.name || "Your"} avatar`}
              onError={() => setAvatarBroken(true)}
            />
          ) : (
            <span className="form__pro-fallback">{avatarInitials}</span>
          )}
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
              placeholder={
                isAuthenticated ? "Send your signal..." : "Sign in to join the conversation"
              }
              required
              disabled={!isAuthenticated}
            />
            <div className="form__footer">
              <p className="form__counter">{commentText.length}/280</p>
              <button
                className="form__btn"
                type="submit"
                disabled={isAuthenticated ? isSubmitting || !commentText.trim() : false}
              >
                {isAuthenticated
                  ? isSubmitting
                    ? "Posting..."
                    : "Post Signal"
                  : "Sign In to Comment"}
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
