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
const MAX_THUMBNAIL_UPLOAD_BYTES = 10 * 1024 * 1024;
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
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
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

  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreviewUrl("");
      return undefined;
    }

    const temporaryPreviewUrl = URL.createObjectURL(thumbnailFile);
    setThumbnailPreviewUrl(temporaryPreviewUrl);

    return () => {
      URL.revokeObjectURL(temporaryPreviewUrl);
    };
  }, [thumbnailFile]);

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
    setUploadProgress(0);
    setVideoFile(selectedFile);
  };

  const handleThumbnailSelection = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      setThumbnailFile(null);
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setUploadFeedback("Please select a valid thumbnail image.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_THUMBNAIL_UPLOAD_BYTES) {
      const maxMb = Math.round(MAX_THUMBNAIL_UPLOAD_BYTES / (1024 * 1024));
      setUploadFeedback(`Thumbnail image is too large. Max size is ${maxMb}MB.`);
      event.target.value = "";
      return;
    }

    setUploadFeedback("");
    setUploadProgress(0);
    setThumbnailFile(selectedFile);
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

    if (thumbnailFile) {
      uploadVideoFormData.append("thumbnail", thumbnailFile);
    }

    setUploadFeedback("");
    setUploadProgress(0);
    setIsPublishing(true);
    try {
      await axios.post(`${API_URL}videos`, uploadVideoFormData, {
        headers: getAuthHeaders(token),
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) {
            return;
          }

          const nextProgress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );

          setUploadProgress(Math.min(100, Math.max(0, nextProgress)));
        },
      });
      setUploadProgress(100);
      alert("Published successfully.");
      NavigateToPage("/");
    } catch (error) {
      console.log(error);
      setUploadProgress(0);

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
            poster={thumbnailPreviewUrl || ThumbnailImg}
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
            {thumbnailFile && (
              <p className="upload__file-meta">
                Thumbnail: {thumbnailFile.name} ·{" "}
                {(thumbnailFile.size / (1024 * 1024)).toFixed(1)}MB
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
          <label className="upload__title--description" htmlFor="thumbnailFile">
            Thumbnail Image
          </label>
          <input
            className="upload__file-input"
            type="file"
            id="thumbnailFile"
            name="thumbnailFile"
            accept="image/*"
            onChange={handleThumbnailSelection}
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
          {(isPublishing || uploadProgress > 0) && (
            <div className="upload__progress" aria-live="polite">
              <div className="upload__progress-head">
                <span>
                  {uploadProgress >= 100
                    ? "Processing upload"
                    : "Uploading media"}
                </span>
                <strong>{uploadProgress}%</strong>
              </div>
              <div
                className="upload__progress-track"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={uploadProgress}
              >
                <span
                  className="upload__progress-bar"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
          <div className="upload__btn-container">
            <button type="submit" className="upload__pub-btn" disabled={isPublishing}>
              {isPublishing && uploadProgress < 100
                ? `Uploading ${uploadProgress}%`
                : isPublishing
                  ? "Processing..."
                  : "Publish"}
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
