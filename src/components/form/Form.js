import "./Form.scss";
import ProImg from "../../assets/images/Mohan-muruge.jpg";

function Form() {
  return (
    <section className="form">
      <div className="form__sub-content">
        <h2 className="form__subtitle">3 Comments</h2>
      </div>
      <div className="form__container">
        <div className="form__img-container">
          <img className="form__pro-img" src={ProImg} alt="Profile img" />
        </div>
        <div className="form__section">
          <div className="form__title-section">
            <h2 className="form__title">JOIN THE CONVERSATION</h2>
          </div>
          <form className="form__field">
            <textarea
              rows={3}
              className="form__input"
              type="text"
              placeholder="Add a new comment"
            />
            <button className="form__btn">COMMENT</button>
          </form>
        </div>
      </div>
    </section>
  );
}


export default Form;
