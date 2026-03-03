import Hero from "../../components/hero/Hero";
import Article from "../../components/article/Article";
import Form from "../../components/form/Form";
import Comments from "../../components/comments/Comments";
import Playlist from "../../components/playlist/Playlist";
import { API_URL } from "../../components/utilities/Utilities";
import "./HomePage.scss";

import axios from "axios";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";

function HomePage({ searchQuery }) {
  const [playlist, setPlaylist] = useState([]);
  const [currentVideoDetails, setCurrentVideoDetails] = useState(null);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [commentFeedback, setCommentFeedback] = useState("");
  const [likingCommentIds, setLikingCommentIds] = useState([]);
  const [deletingCommentIds, setDeletingCommentIds] = useState([]);
  const { videoId } = useParams();

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
      .get(`${API_URL}videos/${id}`)
      .then((response) => {
        setCurrentVideoDetails(response.data);
        setCommentFeedback("");
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

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

  const handleCreateComment = async (commentText) => {
    if (!currentVideoDetails) {
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
      name: "You",
      comment: trimmedComment,
      likes: 0,
      timestamp: Date.now(),
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
          name: "You",
          comment: trimmedComment,
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

      setCommentFeedback("Could not post your signal. Please try again.");
      return false;
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!currentVideoDetails) {
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

        return {
          ...comment,
          likes: Number(comment.likes || 0) + 1,
        };
      })
    );

    try {
      const response = await axios.patch(
        `${API_URL}videos/${videoIdForAction}/comments/${commentId}/like`
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

          return {
            ...comment,
            likes: Math.max(0, Number(comment.likes || 0) - 1),
          };
        })
      );

      setCommentFeedback("Could not like this signal. Please try again.");
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
      await axios.delete(
        `${API_URL}videos/${videoIdForAction}/comments/${commentId}`
      );
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

      setCommentFeedback("Could not delete this signal. Please try again.");
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
          />
          <Comments
            comments={comments}
            onLikeComment={handleLikeComment}
            onDeleteComment={handleDeleteComment}
            likingCommentIds={likingCommentIds}
            deletingCommentIds={deletingCommentIds}
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
