import "./Upload.scss";
import { Link, useNavigate } from "react-router-dom";
import ThumbnailImg from "../../assets/images/Upload-video-preview.jpg";
import { API_URL } from "../../components/utilities/Utilities";
import axios from "axios";

const Upload = () => {
  const NavigateToPage = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();

    const uploadVideo = {
      title: event.target.videoTitle.value,
      description: event.target.videoDescription.value,
    };
        axios
        .post(`${API_URL}videos`, uploadVideo)
        .then((response) => {
        })
        .catch((error) => {
          console.log(error);
        });


    const uploadForm = event.target;
    const videoTitle = uploadForm.videoTitle.value;
    const videoDescription = uploadForm.videoDescription.value;

    if (!videoTitle || !videoDescription) {
      return alert("Failed to Publish, please fill out all form inputs");
    }

    alert("Publish successfully");
    setTimeout(() => NavigateToPage("/"), 3000);
  };
  return(
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
          id="videoTitle"

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
          id="videoDescription"

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
)};

export default Upload;
