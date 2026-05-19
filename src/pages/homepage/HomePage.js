import Hero from "../../components/hero/Hero";
import Article from "../../components/article/Article";
import Form from "../../components/form/Form";
import Comments from "../../components/comments/Comments";
import Playlist from "../../components/playlist/Playlist";
import { API_URL, getAuthHeaders } from "../../components/utilities/Utilities";
import "./HomePage.scss";

import axios from "axios";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const MIN_PROGRESS_UPDATE_DELTA_SECONDS = 5;
const MIN_PROGRESS_UPDATE_INTERVAL_MS = 7000;
const MAX_WATCH_HISTORY_ITEMS = 40;
const MAX_CONTINUE_WATCHING_ITEMS = 6;
const MAX_FOLLOWING_FEED_ITEMS = 8;
const MAX_PERSONALIZED_FEED_ITEMS = 80;
const MIN_CONTINUE_PROGRESS_SECONDS = 1;
const FEED_MODE_FOR_YOU = "for-you";
const FEED_MODE_FOLLOWING = "following";
const FEED_MODE_TRENDING = "trending";
const HOME_FEED_MODES = [
  { id: FEED_MODE_FOR_YOU, label: "For You" },
  { id: FEED_MODE_FOLLOWING, label: "Following" },
  { id: FEED_MODE_TRENDING, label: "Trending" },
];

const sortWatchHistoryEntries = (historyEntries = []) =>
  [...historyEntries].sort(
    (firstEntry, secondEntry) =>
      (Number(secondEntry.updatedAt) || 0) - (Number(firstEntry.updatedAt) || 0)
  );

const buildWatchProgressLookup = (historyEntries = []) =>
  historyEntries.reduce((lookup, entry) => {
    if (entry?.videoId) {
      lookup[entry.videoId] = entry;
    }

    return lookup;
  }, {});

const upsertWatchHistoryEntry = (historyEntries = [], nextEntry = null) => {
  if (!nextEntry?.videoId) {
    return historyEntries;
  }

  const nextHistory = historyEntries.filter(
    (entry) => entry.videoId !== nextEntry.videoId
  );
  nextHistory.push(nextEntry);

  return sortWatchHistoryEntries(nextHistory).slice(0, MAX_WATCH_HISTORY_ITEMS);
};

const formatSecondsAsTimestamp = (rawSeconds = 0) => {
  const totalSeconds = Math.max(0, Math.round(Number(rawSeconds) || 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const formatLastWatched = (updatedAt) => {
  const timestamp = Number(updatedAt);

  if (!timestamp) {
    return "";
  }

  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatPublishedDate = (timestamp) => {
  const numericTimestamp = Number(timestamp);

  if (!numericTimestamp) {
    return "";
  }

  return new Date(numericTimestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const parseMetric = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  if (typeof value !== "string") {
    return 0;
  }

  const parsedValue = Number(value.replace(/[^0-9]/g, ""));

  return Number.isFinite(parsedValue) ? Math.max(0, Math.round(parsedValue)) : 0;
};

const formatMetric = (value) =>
  new Intl.NumberFormat("en-US").format(Math.max(0, Number(value) || 0));

const getCommentReplies = (comment = {}) =>
  Array.isArray(comment.replies) ? comment.replies : [];

const countThreadComments = (comments = []) =>
  comments.reduce(
    (count, comment) => count + 1 + countThreadComments(getCommentReplies(comment)),
    0
  );

const updateThreadCommentById = (comments = [], targetCommentId = "", updater) =>
  comments.map((comment) => {
    const replies = getCommentReplies(comment);

    if (comment.id === targetCommentId) {
      const updatedComment = updater(comment);

      return {
        ...updatedComment,
        replies: getCommentReplies(updatedComment).length
          ? getCommentReplies(updatedComment)
          : replies,
      };
    }

    return {
      ...comment,
      replies: updateThreadCommentById(replies, targetCommentId, updater),
    };
  });

const appendReplyToThread = (comments = [], parentCommentId = "", replyComment = null) =>
  comments.map((comment) => {
    const replies = getCommentReplies(comment);

    if (comment.id === parentCommentId) {
      return {
        ...comment,
        replies: replyComment ? [...replies, replyComment] : replies,
      };
    }

    return {
      ...comment,
      replies: appendReplyToThread(replies, parentCommentId, replyComment),
    };
  });

const removeThreadCommentById = (comments = [], targetCommentId = "") =>
  comments
    .filter((comment) => comment.id !== targetCommentId)
    .map((comment) => ({
      ...comment,
      replies: removeThreadCommentById(getCommentReplies(comment), targetCommentId),
    }));

const findThreadCommentById = (comments = [], targetCommentId = "") => {
  for (const comment of comments) {
    if (comment.id === targetCommentId) {
      return comment;
    }

    const nestedComment = findThreadCommentById(
      getCommentReplies(comment),
      targetCommentId
    );

    if (nestedComment) {
      return nestedComment;
    }
  }

  return null;
};

const collectThreadCommentIds = (comment = null) => {
  if (!comment?.id) {
    return [];
  }

  return [
    comment.id,
    ...getCommentReplies(comment).flatMap((reply) => collectThreadCommentIds(reply)),
  ];
};

const removeThreadCommentsByIds = (comments = [], targetCommentIds = []) => {
  const commentIdsToRemove =
    targetCommentIds instanceof Set
      ? targetCommentIds
      : new Set(targetCommentIds);

  return comments
    .filter((comment) => !commentIdsToRemove.has(comment.id))
    .map((comment) => ({
      ...comment,
      replies: removeThreadCommentsByIds(
        getCommentReplies(comment),
        commentIdsToRemove
      ),
    }));
};

function HomePage({ searchQuery }) {
  const [playlist, setPlaylist] = useState([]);
  const [currentVideoDetails, setCurrentVideoDetails] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState("");
  const [commentFeedback, setCommentFeedback] = useState("");
  const [likingCommentIds, setLikingCommentIds] = useState([]);
  const [deletingCommentIds, setDeletingCommentIds] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [isLoadingWatchHistory, setIsLoadingWatchHistory] = useState(false);
  const [watchHistoryError, setWatchHistoryError] = useState("");
  const [watchProgressByVideoId, setWatchProgressByVideoId] = useState({});
  const [activeFeedMode, setActiveFeedMode] = useState(FEED_MODE_FOR_YOU);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [feedError, setFeedError] = useState("");
  const [followingFeed, setFollowingFeed] = useState([]);
  const [isLoadingFollowingFeed, setIsLoadingFollowingFeed] = useState(false);
  const [followingFeedError, setFollowingFeedError] = useState("");
  const [isUpdatingCreatorFollow, setIsUpdatingCreatorFollow] = useState(false);
  const [creatorFollowFeedback, setCreatorFollowFeedback] = useState("");
  const [isUpdatingVideoLike, setIsUpdatingVideoLike] = useState(false);
  const [isUpdatingVideoSave, setIsUpdatingVideoSave] = useState(false);
  const [videoActionFeedback, setVideoActionFeedback] = useState("");
  const lastProgressSyncByVideoIdRef = useRef({});
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token, user } = useAuth();

  const mutateCommentsForVideo = (targetVideoId, mutationFn) => {
    setCurrentVideoDetails((previousVideo) => {
      if (!previousVideo || previousVideo.id !== targetVideoId) {
        return previousVideo;
      }

      return {
        ...previousVideo,
        comments: mutationFn(previousVideo.comments || []),
      };
    });
  };

  const getVideoById = useCallback((id) => {
    axios
      .get(`${API_URL}videos/${id}`, {
        headers: getAuthHeaders(token),
      })
      .then((response) => {
        setCurrentVideoDetails(response.data);
        setCommentFeedback("");
        setCreatorFollowFeedback("");
        setVideoActionFeedback("");
        setIsUpdatingCreatorFollow(false);
        setIsUpdatingVideoLike(false);
        setIsUpdatingVideoSave(false);
        setReplyingToCommentId("");
        setLikingCommentIds([]);
        setDeletingCommentIds([]);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [token]);

  const applyWatchHistoryEntry = useCallback((nextEntry) => {
    if (!nextEntry?.videoId) {
      return;
    }

    setWatchProgressByVideoId((previousLookup) => ({
      ...previousLookup,
      [nextEntry.videoId]: nextEntry,
    }));
    setWatchHistory((previousHistory) =>
      upsertWatchHistoryEntry(previousHistory, nextEntry)
    );
  }, []);

  const loadWatchHistory = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setIsLoadingWatchHistory(false);
      setWatchHistory([]);
      setWatchProgressByVideoId({});
      setWatchHistoryError("");
      return;
    }

    setIsLoadingWatchHistory(true);
    setWatchHistoryError("");

    try {
      const response = await axios.get(`${API_URL}videos/history`, {
        headers: getAuthHeaders(token),
      });
      const historyEntries = Array.isArray(response.data?.history)
        ? sortWatchHistoryEntries(response.data.history)
        : [];

      setWatchHistory(historyEntries);
      setWatchProgressByVideoId(buildWatchProgressLookup(historyEntries));
    } catch (error) {
      console.log(error);
      setWatchHistoryError("Watch history is temporarily unavailable.");
    } finally {
      setIsLoadingWatchHistory(false);
    }
  }, [isAuthenticated, token]);

  const loadFollowingFeed = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setIsLoadingFollowingFeed(false);
      setFollowingFeed([]);
      setFollowingFeedError("");
      return;
    }

    setIsLoadingFollowingFeed(true);
    setFollowingFeedError("");

    try {
      const response = await axios.get(`${API_URL}videos/following`, {
        headers: getAuthHeaders(token),
      });
      const feedVideos = Array.isArray(response.data?.videos)
        ? [...response.data.videos]
            .sort(
              (firstVideo, secondVideo) =>
                (Number(secondVideo.timestamp) || 0) -
                (Number(firstVideo.timestamp) || 0)
            )
            .slice(0, MAX_FOLLOWING_FEED_ITEMS)
        : [];

      setFollowingFeed(feedVideos);
    } catch (error) {
      console.log(error);
      setFollowingFeedError("Following feed is temporarily unavailable.");
    } finally {
      setIsLoadingFollowingFeed(false);
    }
  }, [isAuthenticated, token]);

  const loadPersonalizedFeed = useCallback(async () => {
    setIsLoadingFeed(true);
    setFeedError("");

    try {
      const response = await axios.get(`${API_URL}videos/feed`, {
        params: {
          mode: activeFeedMode,
          limit: MAX_PERSONALIZED_FEED_ITEMS,
        },
        headers: getAuthHeaders(token),
      });
      const nextFeed = Array.isArray(response.data?.videos)
        ? response.data.videos
        : [];
      const resolvedMode = response.data?.mode;

      if (
        typeof resolvedMode === "string" &&
        resolvedMode &&
        resolvedMode !== activeFeedMode
      ) {
        setActiveFeedMode(resolvedMode);
      }

      setPlaylist(nextFeed);
    } catch (error) {
      console.log(error);
      setFeedError("Personalized feed is temporarily unavailable.");

      try {
        const fallbackResponse = await axios.get(`${API_URL}videos`, {
          headers: getAuthHeaders(token),
        });
        const fallbackVideos = Array.isArray(fallbackResponse.data)
          ? fallbackResponse.data
          : [];

        setPlaylist(fallbackVideos);
      } catch (fallbackError) {
        console.log(fallbackError);
        setPlaylist([]);
      }
    } finally {
      setIsLoadingFeed(false);
    }
  }, [activeFeedMode, token]);

  useEffect(() => {
    loadPersonalizedFeed();
  }, [loadPersonalizedFeed]);

  useEffect(() => {
    loadWatchHistory();
  }, [loadWatchHistory]);

  useEffect(() => {
    loadFollowingFeed();
  }, [loadFollowingFeed]);

  useEffect(() => {
    if (!playlist.length) {
      return;
    }

    const activeVideoId = videoId || playlist[0].id;
    getVideoById(activeVideoId);
  }, [getVideoById, videoId, playlist]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const activeVideoId = currentVideoDetails ? currentVideoDetails.id : null;
  const availableCategories = useMemo(() => {
    const categories = new Set(["All"]);

    playlist.forEach((video) => {
      const category = (video.category || "").trim();

      if (category) {
        categories.add(category);
      }
    });

    if (currentVideoDetails?.category?.trim()) {
      categories.add(currentVideoDetails.category.trim());
    }

    return Array.from(categories);
  }, [playlist, currentVideoDetails]);

  useEffect(() => {
    if (!availableCategories.includes(activeCategory)) {
      setActiveCategory("All");
    }
  }, [availableCategories, activeCategory]);

  const filteredPlaylist = useMemo(
    () =>
      playlist.filter((video) => {
        const isActive = activeVideoId === video.id;
        if (isActive) {
          return false;
        }
        const videoCategory = (video.category || "General").trim();
        const matchesCategory =
          activeCategory === "All" || videoCategory === activeCategory;

        if (!matchesCategory) {
          return false;
        }
        if (!normalizedQuery) {
          return true;
        }
        const normalizedTags = Array.isArray(video.tags)
          ? video.tags.join(" ")
          : typeof video.tags === "string"
            ? video.tags
            : "";
        const searchableContent =
          `${video.title} ${video.channel} ${video.description || ""} ${videoCategory} ${normalizedTags}`.toLowerCase();
        return searchableContent.includes(normalizedQuery);
      }),
    [playlist, activeVideoId, activeCategory, normalizedQuery]
  );

  const continueWatchingItems = useMemo(() => {
    const videosById = new Map(playlist.map((video) => [video.id, video]));

    if (currentVideoDetails?.id) {
      videosById.set(currentVideoDetails.id, currentVideoDetails);
    }

    return watchHistory
      .filter(
        (entry) =>
          !entry?.completed && Number(entry?.progressSeconds || 0) >= 1
      )
      .slice(0, MAX_CONTINUE_WATCHING_ITEMS)
      .map((entry) => {
        const entryVideo = entry.video || videosById.get(entry.videoId);

        if (!entryVideo) {
          return null;
        }

        return {
          ...entry,
          video: entryVideo,
        };
      })
      .filter(Boolean);
  }, [watchHistory, playlist, currentVideoDetails]);

  const activeVideoWatchProgress = currentVideoDetails
    ? watchProgressByVideoId[currentVideoDetails.id]
    : null;
  const resumeFromSeconds = activeVideoWatchProgress?.completed
    ? 0
    : Number(activeVideoWatchProgress?.progressSeconds || 0);

  useEffect(() => {
    if (!currentVideoDetails || !isAuthenticated) {
      return;
    }

    const watchUpdatedAt = Number(currentVideoDetails.watchUpdatedAt || 0);

    if (!watchUpdatedAt && !currentVideoDetails.watchProgressSeconds) {
      return;
    }

    applyWatchHistoryEntry({
      videoId: currentVideoDetails.id,
      progressSeconds: Number(currentVideoDetails.watchProgressSeconds || 0),
      durationSeconds: Number(currentVideoDetails.watchDurationSeconds || 0),
      progressPercent: currentVideoDetails.watchCompleted
        ? 100
        : activeVideoWatchProgress?.progressPercent || 0,
      completed: Boolean(currentVideoDetails.watchCompleted),
      updatedAt: watchUpdatedAt,
      video: {
        id: currentVideoDetails.id,
        title: currentVideoDetails.title,
        channel: currentVideoDetails.channel,
        image: currentVideoDetails.image,
        description: currentVideoDetails.description || "",
        duration: currentVideoDetails.duration || "0:00",
        category: currentVideoDetails.category || "General",
        tags: currentVideoDetails.tags || [],
      },
    });
  }, [
    applyWatchHistoryEntry,
    activeVideoWatchProgress?.progressPercent,
    currentVideoDetails,
    isAuthenticated,
  ]);

  useEffect(() => {
    if (isAuthenticated) {
      return;
    }

    lastProgressSyncByVideoIdRef.current = {};
  }, [isAuthenticated]);

  const handleVideoProgress = useCallback(
    async ({
      videoId: targetVideoId,
      progressSeconds = 0,
      durationSeconds = 0,
      completed = false,
      force = false,
    }) => {
      if (!isAuthenticated || !token || !targetVideoId) {
        return;
      }

      const normalizedProgressSeconds = Math.max(
        0,
        Math.round(Number(progressSeconds) || 0)
      );
      const normalizedDurationSeconds = Math.max(
        0,
        Math.round(Number(durationSeconds) || 0)
      );
      const now = Date.now();
      const lastSync = lastProgressSyncByVideoIdRef.current[targetVideoId];

      if (
        !force &&
        normalizedProgressSeconds < MIN_CONTINUE_PROGRESS_SECONDS &&
        !completed
      ) {
        return;
      }

      if (!force && lastSync) {
        const progressDelta = Math.abs(
          normalizedProgressSeconds - lastSync.progressSeconds
        );
        const timeSinceSync = now - lastSync.syncedAt;

        if (
          progressDelta < MIN_PROGRESS_UPDATE_DELTA_SECONDS &&
          timeSinceSync < MIN_PROGRESS_UPDATE_INTERVAL_MS
        ) {
          return;
        }
      }

      lastProgressSyncByVideoIdRef.current[targetVideoId] = {
        progressSeconds: normalizedProgressSeconds,
        syncedAt: now,
      };

      try {
        const response = await axios.put(
          `${API_URL}videos/${targetVideoId}/progress`,
          {
            progressSeconds: normalizedProgressSeconds,
            durationSeconds: normalizedDurationSeconds,
            completed,
          },
          {
            headers: getAuthHeaders(token),
          }
        );

        applyWatchHistoryEntry(response.data);
      } catch (error) {
        console.log(error);
      }
    },
    [applyWatchHistoryEntry, isAuthenticated, token]
  );

  const routeToAuth = () => {
    setCommentFeedback("Sign in to interact with the conversation.");
    navigate("/auth");
  };

  const routeToAuthForVideoAction = (message) => {
    setVideoActionFeedback(message);
    navigate("/auth");
  };

  const handleToggleVideoLike = async () => {
    if (!currentVideoDetails || isUpdatingVideoLike) {
      return;
    }

    if (!isAuthenticated) {
      routeToAuthForVideoAction("Sign in to like videos.");
      return;
    }

    const videoIdForAction = currentVideoDetails.id;
    const previousIsLiked = Boolean(currentVideoDetails.isLikedByCurrentUser);
    const previousLikes = currentVideoDetails.likes;
    const previousLikesCount = Number.isFinite(
      Number(currentVideoDetails.likesCount)
    )
      ? Number(currentVideoDetails.likesCount)
      : parseMetric(currentVideoDetails.likes);
    const nextIsLiked = !previousIsLiked;
    const nextLikesCount = Math.max(
      0,
      previousLikesCount + (nextIsLiked ? 1 : -1)
    );

    setVideoActionFeedback("");
    setIsUpdatingVideoLike(true);
    setCurrentVideoDetails((previousVideo) => {
      if (!previousVideo || previousVideo.id !== videoIdForAction) {
        return previousVideo;
      }

      return {
        ...previousVideo,
        isLikedByCurrentUser: nextIsLiked,
        likes: formatMetric(nextLikesCount),
        likesCount: nextLikesCount,
      };
    });

    try {
      const response = await axios.patch(
        `${API_URL}videos/${videoIdForAction}/like`,
        {
          liked: nextIsLiked,
        },
        {
          headers: getAuthHeaders(token),
        }
      );

      setCurrentVideoDetails((previousVideo) => {
        if (!previousVideo || previousVideo.id !== videoIdForAction) {
          return previousVideo;
        }

        return {
          ...previousVideo,
          isLikedByCurrentUser: Boolean(response.data?.liked),
          likes: response.data?.likes || previousVideo.likes,
          likesCount: Number(response.data?.likesCount) || previousVideo.likesCount,
        };
      });
    } catch (error) {
      console.log(error);

      setCurrentVideoDetails((previousVideo) => {
        if (!previousVideo || previousVideo.id !== videoIdForAction) {
          return previousVideo;
        }

        return {
          ...previousVideo,
          isLikedByCurrentUser: previousIsLiked,
          likes: previousLikes,
          likesCount: previousLikesCount,
        };
      });

      const failureMessage =
        error.response?.status === 401
          ? "Your session expired. Please sign in again."
          : "Could not update this video like.";

      setVideoActionFeedback(failureMessage);

      if (error.response?.status === 401) {
        navigate("/auth");
      }
    } finally {
      setIsUpdatingVideoLike(false);
    }
  };

  const handleToggleVideoSave = async () => {
    if (!currentVideoDetails || isUpdatingVideoSave) {
      return;
    }

    if (!isAuthenticated) {
      routeToAuthForVideoAction("Sign in to save videos.");
      return;
    }

    const videoIdForAction = currentVideoDetails.id;
    const previousIsSaved = Boolean(currentVideoDetails.isSavedByCurrentUser);
    const nextIsSaved = !previousIsSaved;

    setVideoActionFeedback("");
    setIsUpdatingVideoSave(true);
    setCurrentVideoDetails((previousVideo) => {
      if (!previousVideo || previousVideo.id !== videoIdForAction) {
        return previousVideo;
      }

      return {
        ...previousVideo,
        isSavedByCurrentUser: nextIsSaved,
      };
    });

    try {
      const response = await axios.patch(
        `${API_URL}videos/${videoIdForAction}/save`,
        {
          saved: nextIsSaved,
        },
        {
          headers: getAuthHeaders(token),
        }
      );

      setCurrentVideoDetails((previousVideo) => {
        if (!previousVideo || previousVideo.id !== videoIdForAction) {
          return previousVideo;
        }

        return {
          ...previousVideo,
          isSavedByCurrentUser: Boolean(response.data?.saved),
        };
      });
      setVideoActionFeedback(
        nextIsSaved ? "Saved to your profile." : "Removed from saved videos."
      );
    } catch (error) {
      console.log(error);

      setCurrentVideoDetails((previousVideo) => {
        if (!previousVideo || previousVideo.id !== videoIdForAction) {
          return previousVideo;
        }

        return {
          ...previousVideo,
          isSavedByCurrentUser: previousIsSaved,
        };
      });

      const failureMessage =
        error.response?.status === 401
          ? "Your session expired. Please sign in again."
          : "Could not update your saved videos.";

      setVideoActionFeedback(failureMessage);

      if (error.response?.status === 401) {
        navigate("/auth");
      }
    } finally {
      setIsUpdatingVideoSave(false);
    }
  };

  const handleShareVideo = async () => {
    if (!currentVideoDetails) {
      return;
    }

    const shareUrl = `${window.location.origin}/videos/${currentVideoDetails.id}`;
    const sharePayload = {
      title: currentVideoDetails.title,
      text: `Watch "${currentVideoDetails.title}" on AetherStream.`,
      url: shareUrl,
    };

    setVideoActionFeedback("");

    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setVideoActionFeedback("Video link copied.");
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }

      console.log(error);
      setVideoActionFeedback("Could not share this video.");
    }
  };

  const handleToggleCreatorFollow = async () => {
    if (!currentVideoDetails?.creatorId || isUpdatingCreatorFollow) {
      return;
    }

    if (!isAuthenticated) {
      setCreatorFollowFeedback("Sign in to follow creators.");
      navigate("/auth");
      return;
    }

    if (user?.id && currentVideoDetails.creatorId === user.id) {
      return;
    }

    const videoIdForAction = currentVideoDetails.id;
    const creatorIdForAction = currentVideoDetails.creatorId;
    const previousIsFollowed = Boolean(
      currentVideoDetails.isCreatorFollowedByCurrentUser
    );
    const previousFollowersCount = Math.max(
      0,
      Number(currentVideoDetails.creatorFollowersCount) || 0
    );
    const nextIsFollowed = !previousIsFollowed;
    const nextFollowersCount = Math.max(
      0,
      previousFollowersCount + (nextIsFollowed ? 1 : -1)
    );

    setCreatorFollowFeedback("");
    setIsUpdatingCreatorFollow(true);

    setCurrentVideoDetails((previousVideo) => {
      if (!previousVideo || previousVideo.id !== videoIdForAction) {
        return previousVideo;
      }

      return {
        ...previousVideo,
        isCreatorFollowedByCurrentUser: nextIsFollowed,
        creatorFollowersCount: nextFollowersCount,
      };
    });

    try {
      const response = await axios.put(
        `${API_URL}creators/${creatorIdForAction}/follow`,
        {
          following: nextIsFollowed,
        },
        {
          headers: getAuthHeaders(token),
        }
      );

      setCurrentVideoDetails((previousVideo) => {
        if (!previousVideo || previousVideo.id !== videoIdForAction) {
          return previousVideo;
        }

        return {
          ...previousVideo,
          isCreatorFollowedByCurrentUser: Boolean(response.data?.following),
          creatorFollowersCount: Math.max(
            0,
            Number(response.data?.followersCount) || 0
          ),
        };
      });

      loadFollowingFeed();
      loadPersonalizedFeed();
    } catch (error) {
      console.log(error);

      setCurrentVideoDetails((previousVideo) => {
        if (!previousVideo || previousVideo.id !== videoIdForAction) {
          return previousVideo;
        }

        return {
          ...previousVideo,
          isCreatorFollowedByCurrentUser: previousIsFollowed,
          creatorFollowersCount: previousFollowersCount,
        };
      });

      const failureMessage =
        error.response?.status === 401
          ? "Your session expired. Please sign in again."
          : error.response?.status === 400
            ? "You cannot follow your own creator profile."
            : "Could not update follow status. Please try again.";

      setCreatorFollowFeedback(failureMessage);

      if (error.response?.status === 401) {
        navigate("/auth");
      }
    } finally {
      setIsUpdatingCreatorFollow(false);
    }
  };

  const handleCreateComment = async (commentText) => {
    if (!currentVideoDetails) {
      return false;
    }

    if (!isAuthenticated) {
      routeToAuth();
      return false;
    }

    const trimmedComment = commentText.trim();

    if (!trimmedComment) {
      setCommentFeedback("Add a comment before posting.");
      return false;
    }

    const videoIdForAction = currentVideoDetails.id;
    const temporaryCommentId = `temp-${Date.now()}`;

    const optimisticComment = {
      id: temporaryCommentId,
      name: user?.name || "You",
      avatarUrl: user?.avatarUrl || "",
      comment: trimmedComment,
      likes: 0,
      likedByCurrentUser: false,
      timestamp: Date.now(),
      userId: user?.id,
      parentId: "",
      replies: [],
    };

    setCommentFeedback("");
    setIsPostingComment(true);

    mutateCommentsForVideo(videoIdForAction, (comments) => [
      optimisticComment,
      ...comments,
    ]);

    try {
      const response = await axios.post(
        `${API_URL}videos/${videoIdForAction}/comments`,
        {
          comment: trimmedComment,
        },
        {
          headers: getAuthHeaders(token),
        }
      );

      mutateCommentsForVideo(videoIdForAction, (comments) =>
        comments.map((comment) =>
          comment.id === temporaryCommentId
            ? { ...response.data, replies: getCommentReplies(response.data) }
            : comment
        )
      );

      return true;
    } catch (error) {
      console.log(error);

      mutateCommentsForVideo(videoIdForAction, (comments) =>
        comments.filter((comment) => comment.id !== temporaryCommentId)
      );

      const failureMessage =
        error.response?.status === 401
          ? "Your session expired. Please sign in again."
          : "Could not post your signal. Please try again.";

      setCommentFeedback(failureMessage);

      if (error.response?.status === 401) {
        navigate("/auth");
      }

      return false;
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleReplyComment = async (parentCommentId, commentText) => {
    if (!currentVideoDetails) {
      return false;
    }

    if (!isAuthenticated) {
      routeToAuth();
      return false;
    }

    const trimmedComment = commentText.trim();

    if (!trimmedComment) {
      setCommentFeedback("Add a reply before posting.");
      return false;
    }

    const allComments = currentVideoDetails.comments || [];
    const parentComment = findThreadCommentById(allComments, parentCommentId);

    if (!parentComment) {
      setCommentFeedback("This thread is no longer available.");
      return false;
    }

    const videoIdForAction = currentVideoDetails.id;
    const temporaryCommentId = `temp-reply-${Date.now()}`;
    const optimisticReply = {
      id: temporaryCommentId,
      name: user?.name || "You",
      avatarUrl: user?.avatarUrl || "",
      comment: trimmedComment,
      likes: 0,
      likedByCurrentUser: false,
      timestamp: Date.now(),
      userId: user?.id,
      parentId: parentCommentId,
      replies: [],
    };

    setCommentFeedback("");
    setIsPostingComment(true);

    mutateCommentsForVideo(videoIdForAction, (comments) =>
      appendReplyToThread(comments, parentCommentId, optimisticReply)
    );

    try {
      const response = await axios.post(
        `${API_URL}videos/${videoIdForAction}/comments`,
        {
          comment: trimmedComment,
          parentId: parentCommentId,
        },
        {
          headers: getAuthHeaders(token),
        }
      );

      mutateCommentsForVideo(videoIdForAction, (comments) =>
        updateThreadCommentById(comments, temporaryCommentId, () => ({
          ...response.data,
          replies: getCommentReplies(response.data),
        }))
      );

      return true;
    } catch (error) {
      console.log(error);

      mutateCommentsForVideo(videoIdForAction, (comments) =>
        removeThreadCommentById(comments, temporaryCommentId)
      );

      const failureMessage =
        error.response?.status === 401
          ? "Your session expired. Please sign in again."
          : error.response?.status === 404
            ? "This thread is no longer available."
            : "Could not post your reply. Please try again.";

      setCommentFeedback(failureMessage);

      if (error.response?.status === 401) {
        navigate("/auth");
      }

      return false;
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!currentVideoDetails) {
      return;
    }

    if (!isAuthenticated) {
      routeToAuth();
      return;
    }

    if (
      likingCommentIds.includes(commentId) ||
      deletingCommentIds.includes(commentId)
    ) {
      return;
    }

    const videoIdForAction = currentVideoDetails.id;
    const applyOptimisticLikeToggle = (comments) =>
      updateThreadCommentById(comments, commentId, (comment) => {
        const isCurrentlyLiked = Boolean(comment.likedByCurrentUser);

        return {
          ...comment,
          likes: Math.max(
            0,
            Number(comment.likes || 0) + (isCurrentlyLiked ? -1 : 1)
          ),
          likedByCurrentUser: !isCurrentlyLiked,
        };
      });

    setCommentFeedback("");
    setLikingCommentIds((previousIds) => [...previousIds, commentId]);

    mutateCommentsForVideo(videoIdForAction, applyOptimisticLikeToggle);

    try {
      const response = await axios.patch(
        `${API_URL}videos/${videoIdForAction}/comments/${commentId}/like`,
        {},
        {
          headers: getAuthHeaders(token),
        }
      );

      mutateCommentsForVideo(videoIdForAction, (comments) =>
        updateThreadCommentById(comments, commentId, (comment) => ({
          ...comment,
          ...response.data,
        }))
      );
    } catch (error) {
      console.log(error);

      mutateCommentsForVideo(videoIdForAction, applyOptimisticLikeToggle);

      const failureMessage =
        error.response?.status === 401
          ? "Your session expired. Please sign in again."
          : "Could not update this like. Please try again.";

      setCommentFeedback(failureMessage);

      if (error.response?.status === 401) {
        navigate("/auth");
      }
    } finally {
      setLikingCommentIds((previousIds) =>
        previousIds.filter((id) => id !== commentId)
      );
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!currentVideoDetails) {
      return;
    }

    if (!isAuthenticated) {
      routeToAuth();
      return;
    }

    if (
      deletingCommentIds.includes(commentId) ||
      likingCommentIds.includes(commentId)
    ) {
      return;
    }

    const videoIdForAction = currentVideoDetails.id;
    const allComments = currentVideoDetails.comments || [];
    const targetComment = findThreadCommentById(allComments, commentId);

    if (!targetComment) {
      return;
    }

    const targetCommentIds = collectThreadCommentIds(targetComment);
    const targetCommentIdSet = new Set(targetCommentIds);
    const previousComments = allComments;

    setCommentFeedback("");
    setDeletingCommentIds((previousIds) => [
      ...previousIds,
      ...targetCommentIds.filter((id) => !previousIds.includes(id)),
    ]);
    setLikingCommentIds((previousIds) =>
      previousIds.filter((id) => !targetCommentIdSet.has(id))
    );

    if (targetCommentIdSet.has(replyingToCommentId)) {
      setReplyingToCommentId("");
    }

    mutateCommentsForVideo(videoIdForAction, (comments) =>
      removeThreadCommentsByIds(comments, targetCommentIds)
    );

    try {
      const response = await axios.delete(
        `${API_URL}videos/${videoIdForAction}/comments/${commentId}`,
        {
          headers: getAuthHeaders(token),
        }
      );

      const deletedCommentIds = Array.isArray(response.data?.deletedCommentIds)
        ? response.data.deletedCommentIds
        : [];

      if (deletedCommentIds.length) {
        mutateCommentsForVideo(videoIdForAction, (comments) =>
          removeThreadCommentsByIds(comments, deletedCommentIds)
        );
      }
    } catch (error) {
      console.log(error);

      mutateCommentsForVideo(videoIdForAction, () => previousComments);

      const failureMessage =
        error.response?.status === 401
          ? "Your session expired. Please sign in again."
          : error.response?.status === 403
            ? "You can only delete your own signals."
            : "Could not delete this signal. Please try again.";

      setCommentFeedback(failureMessage);

      if (error.response?.status === 401) {
        navigate("/auth");
      }
    } finally {
      setDeletingCommentIds((previousIds) =>
        previousIds.filter((id) => !targetCommentIdSet.has(id))
      );
    }
  };

  if (!currentVideoDetails) {
    return (
      <main className="home home--loading">
        <p className="home__status">Syncing cinematic feed...</p>
      </main>
    );
  }

  const comments = currentVideoDetails.comments || [];

  return (
    <main className="home">
      <Hero
        currentVideoDetails={currentVideoDetails}
        resumeFromSeconds={resumeFromSeconds}
        onProgressChange={handleVideoProgress}
      />
      {isAuthenticated && (
        <section className="home__continue">
          <div className="home__continue-header">
            <h2 className="home__continue-title">Continue Watching</h2>
            <p className="home__continue-hint">Your saved progress across devices</p>
          </div>
          {watchHistoryError && (
            <p className="home__continue-status">{watchHistoryError}</p>
          )}
          {!watchHistoryError && isLoadingWatchHistory && (
            <p className="home__continue-status">Syncing watch history...</p>
          )}
          {!watchHistoryError &&
            !isLoadingWatchHistory &&
            !continueWatchingItems.length && (
              <p className="home__continue-status">
                Start watching a video and we will keep your place.
              </p>
            )}
          {!watchHistoryError &&
            !isLoadingWatchHistory &&
            !!continueWatchingItems.length && (
              <div className="home__continue-grid">
                {continueWatchingItems.map((entry) => (
                  <Link
                    className="home__continue-card"
                    key={entry.videoId}
                    to={`/videos/${entry.videoId}`}
                  >
                    <div className="home__continue-thumb-wrap">
                      <img
                        className="home__continue-thumb"
                        src={entry.video.image}
                        alt={entry.video.title}
                      />
                      <span className="home__continue-percent">
                        {entry.progressPercent || 0}%
                      </span>
                    </div>
                    <div className="home__continue-content">
                      <h3 className="home__continue-video-title">{entry.video.title}</h3>
                      <p className="home__continue-channel">{entry.video.channel}</p>
                      <p className="home__continue-time">
                        {formatSecondsAsTimestamp(entry.progressSeconds)} /{" "}
                        {formatSecondsAsTimestamp(entry.durationSeconds)}
                      </p>
                      <div className="home__continue-track" aria-hidden="true">
                        <span
                          className="home__continue-track-fill"
                          style={{ width: `${entry.progressPercent || 0}%` }}
                        />
                      </div>
                      <p className="home__continue-updated">
                        Last watched {formatLastWatched(entry.updatedAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
        </section>
      )}
      {isAuthenticated && (
        <section className="home__following">
          <div className="home__following-header">
            <h2 className="home__following-title">Following Feed</h2>
            <p className="home__following-hint">Fresh drops from creators you follow</p>
          </div>
          {followingFeedError && (
            <p className="home__following-status">{followingFeedError}</p>
          )}
          {!followingFeedError && isLoadingFollowingFeed && (
            <p className="home__following-status">Loading following feed...</p>
          )}
          {!followingFeedError &&
            !isLoadingFollowingFeed &&
            !followingFeed.length && (
              <p className="home__following-status">
                Follow creators from any video profile to build this feed.
              </p>
            )}
          {!followingFeedError &&
            !isLoadingFollowingFeed &&
            !!followingFeed.length && (
              <div className="home__following-grid">
                {followingFeed.map((video) => (
                  <article className="home__following-card" key={video.id}>
                    <Link className="home__following-thumb-link" to={`/videos/${video.id}`}>
                      <img
                        className="home__following-thumb"
                        src={video.image}
                        alt={video.title}
                      />
                    </Link>
                    <div className="home__following-content">
                      <Link className="home__following-video-title" to={`/videos/${video.id}`}>
                        {video.title}
                      </Link>
                      {video.creatorId ? (
                        <Link
                          className="home__following-channel"
                          to={`/creators/${video.creatorId}`}
                        >
                          {video.channel}
                        </Link>
                      ) : (
                        <p className="home__following-channel">{video.channel}</p>
                      )}
                      <p className="home__following-meta">
                        {video.duration || "0:00"}
                        {formatPublishedDate(video.timestamp) &&
                          ` • ${formatPublishedDate(video.timestamp)}`}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
        </section>
      )}
      <div className="home__grid">
        <section className="home__primary">
          <Article
            currentVideoDetails={currentVideoDetails}
            onToggleCreatorFollow={handleToggleCreatorFollow}
            onToggleVideoLike={handleToggleVideoLike}
            onToggleVideoSave={handleToggleVideoSave}
            onShareVideo={handleShareVideo}
            isUpdatingCreatorFollow={isUpdatingCreatorFollow}
            isUpdatingVideoLike={isUpdatingVideoLike}
            isUpdatingVideoSave={isUpdatingVideoSave}
            creatorFollowFeedback={creatorFollowFeedback}
            videoActionFeedback={videoActionFeedback}
            currentUserId={user?.id || ""}
          />
          <Form
            commentCount={countThreadComments(comments)}
            onSubmitComment={handleCreateComment}
            isSubmitting={isPostingComment}
            feedbackMessage={commentFeedback}
            isAuthenticated={isAuthenticated}
            onRequireAuth={routeToAuth}
          />
          <Comments
            comments={comments}
            onLikeComment={handleLikeComment}
            onReplyComment={handleReplyComment}
            onDeleteComment={handleDeleteComment}
            likingCommentIds={likingCommentIds}
            deletingCommentIds={deletingCommentIds}
            replyingToCommentId={replyingToCommentId}
            onSetReplyingToCommentId={setReplyingToCommentId}
            isPostingComment={isPostingComment}
            currentUserId={user?.id || ""}
            isAuthenticated={isAuthenticated}
            onRequireAuth={routeToAuth}
          />
        </section>
        <aside className="home__rail">
          <Playlist
            currentVideoDetails={currentVideoDetails}
            playlist={filteredPlaylist}
            searchQuery={searchQuery}
            feedModes={HOME_FEED_MODES}
            activeFeedMode={activeFeedMode}
            onFeedModeChange={setActiveFeedMode}
            isLoadingFeed={isLoadingFeed}
            feedError={feedError}
            isAuthenticated={isAuthenticated}
            activeCategory={activeCategory}
            categories={availableCategories}
            onCategoryChange={setActiveCategory}
          />
        </aside>
      </div>
    </main>
  );
}

export default HomePage;
