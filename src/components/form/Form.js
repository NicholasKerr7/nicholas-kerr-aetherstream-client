import "./Form.scss";
import ProImg from "../../assets/images/Mohan-muruge.jpg";
import CommentIcon from "../../assets/Icons/add_comment.svg";

function Form() {
  return (
    <section className="form">
      <div className="form__sub-content">
        <h2 className="form__subtitle">3 Comments</h2>
      </div>
      <div className="form__container">
        <div className="form__img-container">
          <img className="form__pro-img" src={ProImg} alt="Profile image" />
        </div>
        <div className="form__section">
          <div className="form__title-section">
            <h2 className="form__title">JOIN THE CONVERSATION</h2>
          </div>
          <form className="form__field">
            <input
              className="form__input"
              type="text"
              placeholder="Add a new comment"
            />
            <img
              className="form__comment-icon"
              src={CommentIcon}
              alt="Comment icon"
            />
            <button className="form__btn">COMMENT</button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Form;
