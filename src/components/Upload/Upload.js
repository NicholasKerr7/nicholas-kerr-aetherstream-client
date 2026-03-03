import "./Upload.scss";
import { Link, useNavigate } from "react-router-dom";
import ThumbnailImg from "../../assets/images/Upload-video-preview.jpg";
import { API_URL } from "../../components/utilities/Utilities";
import axios from "axios";
import { useState } from "react";

const MAX_TITLE_LENGTH = 70;
const MAX_DESCRIPTION_LENGTH = 260;

const Upload = () => {
  const NavigateToPage = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const videoTitle = title.trim();
    const videoDescription = description.trim();

    if (!videoTitle || !videoDescription) {
      alert("Failed to publish. Please complete all inputs.");
      return;
    }

    const uploadVideo = {
      title: videoTitle,
      description: videoDescription,
    };

    setIsPublishing(true);
    try {
      await axios.post(`${API_URL}videos`, uploadVideo);
      alert("Published successfully.");
      NavigateToPage("/");
    } catch (error) {
      console.log(error);
      alert("Publish failed. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <section className="upload">
      <div className="upload__sub-content">
        <p className="upload__kicker">AetherStream Studio</p>
        <h2 className="upload__subtitle">Publish A New Experience</h2>
      </div>
      <div className="upload__container">
        <div className="upload__img-container">
          <h2 className="upload__title">Video Thumbnail</h2>
          <video className="upload__thumb-img" poster={ThumbnailImg} />
          <div className="upload__preview-panel">
            <p className="upload__preview-label">Live Preview</p>
            <h3 className="upload__preview-title">
              {title.trim() || "Your next flagship video"}
            </h3>
            <p className="upload__preview-text">
              {description.trim() ||
                "A compelling summary helps viewers decide faster."}
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="upload__field">
          <label className="upload__title--description" htmlFor="videoTitle">
            Video Title
          </label>
          <textarea
            rows={1}
            className="upload__input"
            name="videoTitle"
            id="videoTitle"
            maxLength={MAX_TITLE_LENGTH}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add a title to your video"
            required
          />
          <p className="upload__counter">
            {title.length}/{MAX_TITLE_LENGTH}
          </p>
          <label
            className="upload__title--description"
            htmlFor="videoDescription"
          >
            Video Description
          </label>
          <textarea
            rows={4}
            className="upload__input--description"
            name="videoDescription"
            id="videoDescription"
            maxLength={MAX_DESCRIPTION_LENGTH}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add a description to your video"
            required
          />
          <p className="upload__counter">
            {description.length}/{MAX_DESCRIPTION_LENGTH}
          </p>
          <div className="upload__btn-container">
            <button type="submit" className="upload__pub-btn" disabled={isPublishing}>
              {isPublishing ? "Publishing..." : "Publish"}
            </button>
            <Link to="/" className="upload__cancel-btn">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
};

export default Upload;
