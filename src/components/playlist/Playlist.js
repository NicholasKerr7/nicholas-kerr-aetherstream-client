import { Link } from "react-router-dom";
import { useMemo } from "react";
import "./Playlist.scss";

function Playlist({
  currentVideoDetails,
  playlist,
  searchQuery,
  activeCategory = "All",
  categories = ["All"],
  onCategoryChange = () => {},
}) {
  const filteredVideos = playlist.filter(
    (video) => currentVideoDetails.id !== video.id
  );
  const normalizedSearch = searchQuery.trim();
  const orderedCategories = useMemo(() => {
    const categoryValues = Array.from(new Set(categories.filter(Boolean)));
    const nonAllCategories = categoryValues
      .filter((category) => category !== "All")
      .sort((first, second) => first.localeCompare(second));

    return ["All", ...nonAllCategories];
  }, [categories]);

  const activeFilters = [];

  if (normalizedSearch) {
    activeFilters.push(`"${normalizedSearch}"`);
  }

  if (activeCategory !== "All") {
    activeFilters.push(activeCategory);
  }

  return (
    <section className="playlist">
      <div className="playlist__header">
        <h2 className="playlist__title">Up Next</h2>
        <p className="playlist__hint">
          {activeFilters.length
            ? `Filtered by ${activeFilters.join(" • ")}`
            : "Curated for your queue"}
        </p>
      </div>

      <div className="playlist__chips">
        {orderedCategories.map((category) => (
          <button
            key={category}
            type="button"
            className={`playlist__chip ${activeCategory === category ? "playlist__chip--active" : ""}`}
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {!filteredVideos.length && (
        <p className="playlist__empty">
          No videos matched your current discovery filters.
        </p>
      )}

      {filteredVideos.map((video, index) => {
        return (
          <Link
            to={`/videos/${video.id}`}
            key={video.id}
            className="playlist__container"
          >
            <p className="playlist__index">{String(index + 1).padStart(2, "0")}</p>
            <div className="playlist__video-container">
              <img
                className="playlist__video"
                src={video.image ? video.image : currentVideoDetails.image}
                alt={video.title}
              />
            </div>
            <div className="playlist__text-container">
              <h3 className="playlist__subtitle">{video.title}</h3>
              <p className="playlist__author">{video.channel}</p>
              <p className="playlist__meta">
                <span className="playlist__category">{video.category || "General"}</span>
                {Array.isArray(video.tags) && video.tags.length > 0 && (
                  <span className="playlist__tags">
                    {video.tags
                      .slice(0, 3)
                      .map((tag) => `#${tag}`)
                      .join(" ")}
                  </span>
                )}
              </p>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
export default Playlist;
