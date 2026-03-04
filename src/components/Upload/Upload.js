import "./Upload.scss";
import { Link, Navigate, useNavigate } from "react-router-dom";
import ThumbnailImg from "../../assets/images/Upload-video-preview.jpg";
import {
  API_URL,
  getAuthHeaders,
} from "../../components/utilities/Utilities";
import axios from "axios";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const MAX_TITLE_LENGTH = 70;
const MAX_DESCRIPTION_LENGTH = 260;
const MAX_VIDEO_UPLOAD_BYTES = 750 * 1024 * 1024;
const CATEGORY_OPTIONS = [
  "General",
  "Adventure",
  "Action Sports",
  "Wellness",
  "Technology",
  "Lifestyle",
];

const Upload = () => {
  const NavigateToPage = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [tagsInput, setTagsInput] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [uploadFeedback, setUploadFeedback] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const { isAuthenticated, token } = useAuth();
  const normalizedTags = tagsInput
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);

  useEffect(() => {
    if (!videoFile) {
      setVideoPreviewUrl("");
      return undefined;
    }

    const temporaryPreviewUrl = URL.createObjectURL(videoFile);
    setVideoPreviewUrl(temporaryPreviewUrl);

    return () => {
      URL.revokeObjectURL(temporaryPreviewUrl);
    };
  }, [videoFile]);

  if (!isAuthenticated) {
    return <Navigate replace to="/auth" />;
  }

  const handleFileSelection = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      setVideoFile(null);
      return;
    }

    if (!selectedFile.type.startsWith("video/")) {
      setUploadFeedback("Please select a valid video file.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_VIDEO_UPLOAD_BYTES) {
      const maxMb = Math.round(MAX_VIDEO_UPLOAD_BYTES / (1024 * 1024));
      setUploadFeedback(`Video file is too large. Max size is ${maxMb}MB.`);
      event.target.value = "";
      return;
    }

    setUploadFeedback("");
    setVideoFile(selectedFile);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const videoTitle = title.trim();
    const videoDescription = description.trim();
    const selectedCategory = category.trim();

    if (!videoTitle || !videoDescription || !videoFile) {
      setUploadFeedback("Failed to publish. Complete all fields and attach a video.");
      return;
    }

    const uploadVideoFormData = new FormData();
    uploadVideoFormData.append("title", videoTitle);
    uploadVideoFormData.append("description", videoDescription);
    uploadVideoFormData.append("category", selectedCategory);
    uploadVideoFormData.append("tags", normalizedTags.join(","));
    uploadVideoFormData.append("video", videoFile);

    setUploadFeedback("");
    setIsPublishing(true);
    try {
      await axios.post(`${API_URL}videos`, uploadVideoFormData, {
        headers: getAuthHeaders(token),
      });
      alert("Published successfully.");
      NavigateToPage("/");
    } catch (error) {
      console.log(error);

      if (error.response?.status === 401) {
        alert("Your session expired. Please sign in again.");
        NavigateToPage("/auth");
      } else {
        const message =
          error.response?.data?.message || "Publish failed. Please try again.";
        setUploadFeedback(message);
      }
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
          <video
            className="upload__thumb-img"
            poster={ThumbnailImg}
            src={videoPreviewUrl || undefined}
            controls={Boolean(videoPreviewUrl)}
            muted
            playsInline
          />
          <div className="upload__preview-panel">
            <p className="upload__preview-label">Live Preview</p>
            <h3 className="upload__preview-title">
              {title.trim() || "Your next flagship video"}
            </h3>
            <p className="upload__preview-text">
              {description.trim() ||
                "A compelling summary helps viewers decide faster."}
            </p>
            <p className="upload__preview-meta">
              Category: {category || "General"}
            </p>
            {!!normalizedTags.length && (
              <p className="upload__preview-meta">
                Tags: {normalizedTags.join(", ")}
              </p>
            )}
            {videoFile && (
              <p className="upload__file-meta">
                {videoFile.name} · {(videoFile.size / (1024 * 1024)).toFixed(1)}MB
              </p>
            )}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="upload__field">
          <label className="upload__title--description" htmlFor="videoFile">
            Video File
          </label>
          <input
            className="upload__file-input"
            type="file"
            id="videoFile"
            name="videoFile"
            accept="video/*"
            onChange={handleFileSelection}
            required
          />
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
          <label className="upload__title--description" htmlFor="videoCategory">
            Category
          </label>
          <select
            className="upload__select"
            id="videoCategory"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <label className="upload__title--description" htmlFor="videoTags">
            Tags
          </label>
          <input
            className="upload__input"
            id="videoTags"
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            placeholder="travel, alps, mountain"
          />
          {uploadFeedback && <p className="upload__feedback">{uploadFeedback}</p>}
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
