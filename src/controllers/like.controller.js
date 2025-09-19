import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  const userId = req.user._id;
  const { type } = req.body; // "like" or "dislike"

  if (!videoId) {
    throw new ApiError(400, "Video id is required");
  }
  if (!["like", "dislike"].includes(type)) {
    throw new ApiError(400, "Invalid reaction type");
  }

  const existing = await Like.findOne({ likedBy: userId, video: videoId });

  if (existing) {
    if (existing.type === type) {
      // Same reaction → remove
      await existing.deleteOne();
    } else {
      // Switch reaction (like <-> dislike)
      existing.type = type;
      await existing.save();
    }
  } else {
    // No reaction → add new
    await Like.create({ likedBy: userId, video: videoId, type });
  }

  // ✅ Always calculate fresh counts
  const likeCount = await Like.countDocuments({ video: videoId, type: "like" });
  const dislikeCount = await Like.countDocuments({
    video: videoId,
    type: "dislike",
  });

  // ✅ Get the user's current reaction (or null if removed)
  const userReaction = await Like.findOne({ likedBy: userId, video: videoId });

  res.json(
    new ApiResponse(
      200,
      {
        likeCount,
        dislikeCount,
        userReaction: userReaction ? userReaction.type : null,
      },
      "Reaction updated"
    )
  );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  const { type } = req.body;
  const userId = req.user._id;
  if (!commentId) {
    throw new ApiError(400, "Comment id is required");
  }
  if (!["like", "dislike"].includes(type)) {
    throw new ApiError(400, "Invalid reaction type");
  }

  const existing = await Like.findOne({ likedBy: userId, comment: commentId });
  if (existing) {
    if (existing.type === type) {
      // Same reaction → remove
      await existing.deleteOne();
    } else {
      // Switch reaction (like <-> dislike)
      existing.type = type;
      await existing.save();
    }
  } else {
    await Like.create({ likedBy: userId, comment: commentId, type });
  }
  // ✅ Always calculate fresh counts
  const likeCount = await Like.countDocuments({
    comment: commentId,
    type: "like",
  });
  const dislikeCount = await Like.countDocuments({
    comment: commentId,
    type: "dislike",
  });

  // ✅ Get the user's current reaction (or null if removed)
  const userReaction = await Like.findOne({
    likedBy: userId,
    comment: commentId,
  });

  res.json(
    new ApiResponse(
      200,
      {
        likeCount,
        dislikeCount,
        userReaction: userReaction ? userReaction.type : null,
      },
      "Reaction updated"
    )
  );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  const userId = req.user._id;
  const { type } = req.body;
  if (!tweetId) {
    throw new ApiError(400, "Tweet id is required");
  }
  if (!["like", "dislike"].includes(type)) {
    throw new ApiError(400, "Invalid reaction type");
  }
  const existing = await Like.findOne({ likedBy: userId, tweet: tweetId });
  if (existing) {
    if (existing.type === type) {
      // Same reaction → remove
      await existing.deleteOne();
    } else {
      // Switch reaction (like <-> dislike)
      existing.type = type;
      await existing.save();
    }
  }
  await Like.create({ likedBy: userId, tweet: tweetId, type });

  // ✅ Always calculate fresh counts
  const likeCount = await Like.countDocuments({
    tweet: tweetId,
    type: "like",
  });
  const dislikeCount = await Like.countDocuments({
    tweet: tweetId,
    type: "dislike",
  });

  // ✅ Get the user's current reaction (or null if removed)
  const userReaction = await Like.findOne({
    likedBy: userId,
    tweet: tweetId,
  });

  res.json(
    new ApiResponse(
      200,
      {
        likeCount,
        dislikeCount,
        userReaction: userReaction ? userReaction.type : null,
      },
      "Reaction updated"
    )
  );

  res.json(new ApiResponse(200, { isReacted: true, type }, "tweet liked"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const userId = req.user._id;

  const videos = await Like.find({ likedBy: userId, video: { $exists: true } })
    .populate({
      path: "video",
      select: "title thumbnail duration description owner createdAt",
      populate: {
        path: "owner",
        select: "fullName username avater",
      },
    })
    .sort({ createdAt: -1 });
  if (!videos) {
    throw new ApiError(400, "No Video is found");
  }

  res.json(new ApiResponse(200, videos, "all liked videos"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
