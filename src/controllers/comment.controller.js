import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const userId = req?.user?._id;

  if (!videoId) {
    throw new ApiError(400, "Video id is required");
  }
  const filter = {};

  // Optional filter by userId (if present)
  if (videoId) {
    filter.video = videoId; // Assuming 'owner' field in video schema refers to user
  }

  const total = await Comment.countDocuments(filter);
  const comments = await Comment.find(filter)
    .limit(parseInt(limit))
    .skip((page - 1) * limit)
    .populate("owner", "fullName avater")
    .sort({ createdAt: -1 });

  const enrichedComments = await Promise.all(
    comments.map(async (comment) => {
      const [likeCount, dislikeCount, userReactionDoc] = await Promise.all([
        Like.countDocuments({ comment: comment._id, type: "like" }),
        Like.countDocuments({ comment: comment._id, type: "dislike" }),
        userId ? Like.findOne({ comment: comment._id, likedBy: userId }) : null,
      ]);

      return {
        ...comment.toObject(),
        likeCount,
        dislikeCount,
        userReaction: userReactionDoc ? userReactionDoc.type : null,
      };
    })
  );

  res.json(
    new ApiResponse(200, {
      total,
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      comments: enrichedComments,
    })
  );
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  // in a video schema i have section view how do i calculate total video view in a particalur user
  const { content } = req.body;
  const { videoId } = req.params;
  const userId = req.user._id;

  if (!content && !videoId) {
    throw new ApiError(400, "Video id and content is required");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: userId,
  });

  if (!comment) {
    throw new ApiError(400, "comment is not created");
  }

  const populatedComment = await comment.populate("owner", "fullName avater");
  res.json(
    new ApiResponse(200, populatedComment, "comment created successfully")
  );
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { content } = req.body;
  const { commentId } = req.params;

  if (!content && !commentId) {
    throw new ApiError(400, "comment id and content is required");
  }

  const comment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  ).populate("owner", "fullName avater");

  if (!comment) {
    throw new ApiError(400, "Something went wrong while updating the comment");
  }

  res.json(new ApiResponse(200, comment, "comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "comment id is required");
  }

  await Comment.findByIdAndDelete(commentId);
  res.json(new ApiResponse(200, {}, "comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
