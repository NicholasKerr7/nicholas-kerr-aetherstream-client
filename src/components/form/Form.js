import "./Form.scss";
import ProImg from "../../assets/images/Mohan-muruge.jpg";

function Form({ commentCount = 0 }) {
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
          <form
            className="form__field"
            onSubmit={(event) => event.preventDefault()}
          >
            <textarea
              rows={3}
              className="form__input"
              placeholder="Send your signal..."
              required
            />
            <button className="form__btn" type="submit">
              Post Signal
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Form;
