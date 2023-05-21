import "./Article.scss";
import views from "../../assets/Icons/views.svg";
import likes from "../../assets/Icons/likes.svg";

function Article({ currentVideoDetails }) {
  const date = new Date(currentVideoDetails.timestamp).toLocaleDateString();

  return (
    <article key={currentVideoDetails.id} className="article">
      <div className="article__heading">
        <h1 className="article__title">{currentVideoDetails.title}</h1>
      </div>
      <div className="article__sub-container">
        <div className="article__info">
          <div className="article__author-container">
            <h3 className="article__author">{currentVideoDetails.channel}</h3>
          </div>
          <div className="article__date-container">
            <p className="article__date">{date}</p>
          </div>
        </div>
        <div className="article__engagement">
          <div className="article__views">
            <img className="article__views-icon" src={views} alt="views" />
            <p className="article__views-info">{currentVideoDetails.views}</p>
          </div>
          <div className="article__likes">
            <img className="article__likes-icon" src={likes} alt="likes" />
            <p className="article__likes-info">{currentVideoDetails.likes}</p>
          </div>
        </div>
      </div>
      <div className="article__description">
        {currentVideoDetails.description}
      </div>
    </article>
  );
}

export default Article;
