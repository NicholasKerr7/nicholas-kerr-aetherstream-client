import Hero from "../../components/hero/Hero";
import Article from "../../components/article/Article";
import Form from "../../components/form/Form";
import Comments from "../../components/comments/Comments";
import Playlist from "../../components/playlist/Playlist";
import { API_URL, getAuthHeaders } from "../../components/utilities/Utilities";
import "./HomePage.scss";

import axios from "axios";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function HomePage({ searchQuery }) {
  const [playlist, setPlaylist] = useState([]);
  const [currentVideoDetails, setCurrentVideoDetails] = useState(null);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [commentFeedback, setCommentFeedback] = useState("");
  const [likingCommentIds, setLikingCommentIds] = useState([]);
  const [deletingCommentIds, setDeletingCommentIds] = useState([]);
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
      })
      .catch((error) => {
        console.log(error);
      });
  }, [token]);

  useEffect(() => {
    axios
      .get(`${API_URL}videos`)
      .then((response) => {
        setPlaylist(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  useEffect(() => {
    if (!playlist.length) {
      return;
    }

    const activeVideoId = videoId || playlist[0].id;
    getVideoById(activeVideoId);
  }, [getVideoById, videoId, playlist]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const activeVideoId = currentVideoDetails ? currentVideoDetails.id : null;

  const filteredPlaylist = useMemo(
    () =>
      playlist.filter((video) => {
        const isActive = activeVideoId === video.id;
        if (isActive) {
          return false;
        }
        if (!normalizedQuery) {
          return true;
        }
        const searchableContent = `${video.title} ${video.channel}`.toLowerCase();
        return searchableContent.includes(normalizedQuery);
      }),
    [playlist, activeVideoId, normalizedQuery]
  );

  const routeToAuth = () => {
    setCommentFeedback("Sign in to interact with the conversation.");
    navigate("/auth");
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
          comment.id === temporaryCommentId ? response.data : comment
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
    setCommentFeedback("");
    setLikingCommentIds((previousIds) => [...previousIds, commentId]);

    mutateCommentsForVideo(videoIdForAction, (comments) =>
      comments.map((comment) => {
        if (comment.id !== commentId) {
          return comment;
        }

        const isCurrentlyLiked = Boolean(comment.likedByCurrentUser);

        return {
          ...comment,
          likes: Math.max(
            0,
            Number(comment.likes || 0) + (isCurrentlyLiked ? -1 : 1)
          ),
          likedByCurrentUser: !isCurrentlyLiked,
        };
      })
    );

    try {
      const response = await axios.patch(
        `${API_URL}videos/${videoIdForAction}/comments/${commentId}/like`,
        {},
        {
          headers: getAuthHeaders(token),
        }
      );

      mutateCommentsForVideo(videoIdForAction, (comments) =>
        comments.map((comment) =>
          comment.id === commentId ? { ...comment, ...response.data } : comment
        )
      );
    } catch (error) {
      console.log(error);

      mutateCommentsForVideo(videoIdForAction, (comments) =>
        comments.map((comment) => {
          if (comment.id !== commentId) {
            return comment;
          }

          const isCurrentlyLiked = Boolean(comment.likedByCurrentUser);

          return {
            ...comment,
            likes: Math.max(
              0,
              Number(comment.likes || 0) + (isCurrentlyLiked ? -1 : 1)
            ),
            likedByCurrentUser: !isCurrentlyLiked,
          };
        })
      );

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
    const existingCommentIndex = allComments.findIndex(
      (comment) => comment.id === commentId
    );

    if (existingCommentIndex < 0) {
      return;
    }

    const existingComment = allComments[existingCommentIndex];

    setCommentFeedback("");
    setDeletingCommentIds((previousIds) => [...previousIds, commentId]);

    mutateCommentsForVideo(videoIdForAction, (comments) =>
      comments.filter((comment) => comment.id !== commentId)
    );

    try {
      await axios.delete(`${API_URL}videos/${videoIdForAction}/comments/${commentId}`, {
        headers: getAuthHeaders(token),
      });
    } catch (error) {
      console.log(error);

      mutateCommentsForVideo(videoIdForAction, (comments) => {
        if (comments.some((comment) => comment.id === existingComment.id)) {
          return comments;
        }

        const restoredComments = [...comments];
        restoredComments.splice(existingCommentIndex, 0, existingComment);
        return restoredComments;
      });

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
        previousIds.filter((id) => id !== commentId)
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
      <Hero currentVideoDetails={currentVideoDetails} />
      <div className="home__grid">
        <section className="home__primary">
          <Article currentVideoDetails={currentVideoDetails} />
          <Form
            commentCount={comments.length}
            onSubmitComment={handleCreateComment}
            isSubmitting={isPostingComment}
            feedbackMessage={commentFeedback}
            isAuthenticated={isAuthenticated}
            onRequireAuth={routeToAuth}
          />
          <Comments
            comments={comments}
            onLikeComment={handleLikeComment}
            onDeleteComment={handleDeleteComment}
            likingCommentIds={likingCommentIds}
            deletingCommentIds={deletingCommentIds}
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
          />
        </aside>
      </div>
    </main>
  );
}

export default HomePage;
