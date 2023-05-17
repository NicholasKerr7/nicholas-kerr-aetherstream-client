import "./Article.scss";

function Article() {
  return (
    <article className="article">
      <div className="article__heading">
        <h1 className="article__title">BMX Rampage: 2021 Highlights</h1>
      </div>
      <div>
        <div>
          <h3>By Red Cow</h3>
        </div>
        <div>
          <p>07/11/2021</p>
        </div>
        <div>
          <img src="../../assets/Icons/views.svg" alt="views" />
          <p>1,001,023</p>
        </div>
        <div>
          <img src="../../assets/Icons/likes.svg" alt="likes" />
          <p>110,985</p>
        </div>
      </div>
      <div>On a gusty day in Southern Utah, a group of 25 daring mountain bikers blew the doors off what is possible on two wheels, unleashing some of the biggest moments the sport has ever seen. While mother nature only allowed for one full run before the conditions made it impossible to ride, that was all that was needed for event veteran Kyle Strait, who won the event for the second time -- eight years after his first Red Cow Rampage title</div>
    </article>
  );
}

export default Article;
