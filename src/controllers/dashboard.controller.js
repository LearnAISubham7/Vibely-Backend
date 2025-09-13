import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const userId = req.user._id;
  const filter = {};
  if (userId) {
    filter.owner = userId; // Assuming 'owner' field in video schema refers to user
  }

  const totalVideo = await Video.countDocuments(filter);
  const totalLikes = await Like.countDocuments({ likedBy: userId });
  const totalSubscribers = await Subscription.countDocuments({
    channel: userId,
  });
  const result = await Video.aggregate([
    {
      $match: { owner: new mongoose.Types.ObjectId(userId) },
    },
    {
      $group: {
        _id: null,
        totalViews: {
          $sum: "$views",
        },
      },
    },
  ]);

  const totalViews = result[0]?.totalViews || 0;

  res.json(
    new ApiResponse(
      200,
      { totalLikes, totalSubscribers, totalVideo, totalViews },
      "channel Stat"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const userId = req.user._id;
  const videos = await Video.find({ owner: userId });

  if (!videos) {
    throw new ApiError(400, "No Video is found");
  }

  res.json(new ApiResponse(200, videos, "channel Stat"));
});

export { getChannelStats, getChannelVideos };
