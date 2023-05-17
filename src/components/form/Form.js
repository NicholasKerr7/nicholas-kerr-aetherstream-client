import "./Form.scss";

function Form() {
  return (
    <section>
      <div>
        <h2>3 Comments</h2>
      </div>
      <div>
        <div>
          <img src="" alt="" />
        </div>
        <div>
          <div>
            <h2>JOIN THE CONVERSATION</h2>
          </div>
          <form action="">
            <input
              className="form__field"
              type="text"
              placeholder="Add a new comment"
            />
            <button className="form__btn">COMMENT</button>
          </form>
          <div>
            <img src="" alt="" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Form;
