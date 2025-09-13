import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  const userId = req.user._id;

  if (!videoId) {
    throw new ApiError(400, "Video id is required");
  }

  const existing = await Like.findOne({ likedBy: userId, video: videoId });
  if (existing) {
    await existing.deleteOne();
    return res.json(new ApiResponse(200, {}, "Like removed"));
  }
  await Like.create({ likedBy: userId, video: videoId });

  res.json(new ApiResponse(200, {}, "video liked"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  const userId = req.user._id;
  if (!commentId) {
    throw new ApiError(400, "Comment id is required");
  }

  const existing = await Like.findOne({ likedBy: userId, comment: commentId });
  if (existing) {
    await existing.deleteOne();
    return res.json(new ApiResponse(200, {}, "Like removed"));
  }
  await Like.create({ likedBy: userId, comment: commentId });

  res.json(new ApiResponse(200, {}, "comment liked"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  const userId = req.user._id;
  if (!tweetId) {
    throw new ApiError(400, "Tweet id is required");
  }

  const existing = await Like.findOne({ likedBy: userId, tweet: tweetId });
  if (existing) {
    await existing.deleteOne();
    return res.json(new ApiResponse(200, {}, "Like removed"));
  }
  await Like.create({ likedBy: userId, tweet: tweetId });

  res.json(new ApiResponse(200, {}, "tweet liked"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const userId = req.user._id;

  const videos = await Like.find({ likedBy: userId, video: { $exists: true } });
  if (!videos) {
    throw new ApiError(400, "No Video is found");
  }

  res.json(new ApiResponse(200, videos, "all liked videos"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
