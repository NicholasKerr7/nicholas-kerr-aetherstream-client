import "./Hero.scss";
import { useCallback, useEffect, useRef, useState } from "react";

function Hero({
  currentVideoDetails,
  resumeFromSeconds = 0,
  onProgressChange = () => {},
}) {
  const videoRef = useRef(null);
  const lastAppliedResumeKeyRef = useRef("");
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false);
  const commentCount = currentVideoDetails.comments.length;
  const activeVideoId = currentVideoDetails.id;

  const emitProgress = useCallback(
    (force = false) => {
      const videoElement = videoRef.current;

      if (!videoElement) {
        return;
      }

      const nextProgressSeconds = Number.isFinite(videoElement.currentTime)
        ? Math.max(0, Math.round(videoElement.currentTime))
        : 0;
      const nextDurationSeconds = Number.isFinite(videoElement.duration)
        ? Math.max(0, Math.round(videoElement.duration))
        : 0;
      const completed =
        nextDurationSeconds > 0 &&
        nextProgressSeconds >= Math.max(1, nextDurationSeconds - 1);

      onProgressChange({
        videoId: activeVideoId,
        progressSeconds: nextProgressSeconds,
        durationSeconds: nextDurationSeconds,
        completed,
        force,
      });
    },
    [activeVideoId, onProgressChange]
  );

  useEffect(() => {
    setHasStartedPlayback(false);
  }, [activeVideoId]);

  useEffect(() => {
    const videoElement = videoRef.current;
    const normalizedResumeSeconds = Math.max(
      0,
      Math.round(Number(resumeFromSeconds) || 0)
    );
    const resumeKey = `${activeVideoId}:${normalizedResumeSeconds}`;

    if (!videoElement || !normalizedResumeSeconds) {
      return;
    }

    if (lastAppliedResumeKeyRef.current === resumeKey) {
      return;
    }

    const applyResumePosition = () => {
      const durationSeconds = Number.isFinite(videoElement.duration)
        ? Math.round(videoElement.duration)
        : 0;

      if (durationSeconds && normalizedResumeSeconds >= durationSeconds - 1) {
        return;
      }

      videoElement.currentTime = normalizedResumeSeconds;
      emitProgress(true);
    };

    if (videoElement.readyState >= 1) {
      applyResumePosition();
    } else {
      videoElement.addEventListener("loadedmetadata", applyResumePosition, {
        once: true,
      });
    }

    lastAppliedResumeKeyRef.current = resumeKey;

    return () => {
      videoElement.removeEventListener("loadedmetadata", applyResumePosition);
    };
  }, [activeVideoId, emitProgress, resumeFromSeconds]);

  return (
    <section className="hero">
      <div className="hero__container">
        <div className="hero__media">
          <video
            ref={videoRef}
            className="hero__video"
            src={currentVideoDetails.video}
            poster={currentVideoDetails.image}
            preload="metadata"
            controls
            onPlay={() => setHasStartedPlayback(true)}
            onTimeUpdate={() => emitProgress(false)}
            onPause={() => emitProgress(true)}
            onSeeked={() => emitProgress(true)}
            onEnded={() => emitProgress(true)}
          >
            {currentVideoDetails.captionsUrl && (
              <track
                kind="captions"
                src={currentVideoDetails.captionsUrl}
                srcLang="en"
                label="English captions"
              />
            )}
          </video>
          {!hasStartedPlayback && (
            <img
              className="hero__poster"
              src={currentVideoDetails.image}
              alt=""
              aria-hidden="true"
            />
          )}
        </div>
        <div className="hero__overlay">
          <p className="hero__eyebrow">Now Streaming</p>
          <h2 className="hero__title">{currentVideoDetails.title}</h2>
          <div className="hero__chips">
            <span className="hero__chip">{currentVideoDetails.channel}</span>
            <span className="hero__chip">{currentVideoDetails.views} views</span>
            <span className="hero__chip">
              {commentCount} {commentCount === 1 ? "response" : "responses"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
export default Hero;
