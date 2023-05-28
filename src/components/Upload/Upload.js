import "./Upload.scss";
import { Link } from "react-router-dom";
import ThumbnailImg from "../../assets/images/Upload-video-preview.jpg";

const Upload = () => {
  const handleSubmit = (event) => {
    event.preventDefault();
    
    // const NavigateToPage = useNavigate();
    // const uploadForm = event.target;
    // const videoTitle = uploadForm.videoTitle.value;
    // const videoDescription = uploadForm.videoDescription.value;

    // if (!videoTitle || !videoDescription) {
    //   return alert("Failed to Publish, you have errors in your form");
    // } else {
    //   setTimeout(() => NavigateToPage("/"), 3000);{
    //   alert"Publish successfully";
    // }
  };
  return (
    <section className="upload">
      <div className="upload__sub-content">
        <h2 className="upload__subtitle">Upload Video</h2>
      </div>
      <div className="upload__container">
        <div className="upload__img-container">
          <h2 className="upload__title">VIDEO THUMBNAIL</h2>
          <video className="upload__thumb-img" poster={ThumbnailImg}></video>
        </div>
        <form onSubmit={handleSubmit} className="upload__field">
          <label className="upload__title--description">TITLE YOUR VIDEO</label>
          <textarea
            rows={1}
            className="upload__input"
            type="text"
            name="videoTitle"
            placeholder="Add a title to your video"
          />
          <label className="upload__title--description">
            ADD A VIDEO DESCRIPTION
          </label>
          <textarea
            rows={3}
            className="upload__input--description"
            type="text"
            name="videoDescription"
            placeholder="Add a description to your video"
          />
          <div className="upload__btn-container">
            <button type="submit" className="upload__pub-btn">
              PUBLISH
            </button>
            <Link to="/" className="upload__cancel-btn">
              CANCEL
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
};

export default Upload;
