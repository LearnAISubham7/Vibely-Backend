import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);

  // 🎯 Aggregate videos owned by this user
  const stats = await Video.aggregate([
    {
      $match: {
        owner: userId,
      },
    },

    {
      $lookup: {
        from: "likes", // collection name in Mongo
        localField: "_id", // video._id
        foreignField: "video", // likes.video
        as: "videoLikes",
      },
    },

    {
      $group: {
        _id: null,
        totalVideo: {
          $sum: 1,
        },
        totalViews: {
          $sum: "$views",
        },
        totalLikes: {
          $sum: {
            $size: {
              $filter: {
                input: "$videoLikes",
                as: "like",
                cond: {
                  $eq: ["$$like.type", "like"],
                },
              },
            },
          },
        },
        totalDislikes: {
          $sum: {
            $size: {
              $filter: {
                input: "$videoLikes",
                as: "like",
                cond: {
                  $eq: ["$$like.type", "dislike"],
                },
              },
            },
          },
        },
      },
    },
  ]);

  const totalSubscribers = await Subscription.countDocuments({
    channel: userId,
  });

  const channelStats = {
    totalVideo: stats[0]?.totalVideo || 0,
    totalViews: stats[0]?.totalViews || 0,
    totalLikes: stats[0]?.totalLikes || 0,
    totalDislikes: stats[0]?.totalDislikes || 0,
    totalSubscribers,
  };

  res.json(
    new ApiResponse(200, channelStats, "Channel stats fetched successfully")
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);

  const videos = await Video.aggregate([
    { $match: { owner: userId } },

    // Lookup likes
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "videoLikes",
      },
    },

    // Lookup owner details
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $unwind: "$ownerDetails",
    },

    // Add like/dislike counts
    {
      $addFields: {
        likeCount: {
          $size: {
            $filter: {
              input: "$videoLikes",
              as: "like",
              cond: { $eq: ["$$like.type", "like"] },
            },
          },
        },
        dislikeCount: {
          $size: {
            $filter: {
              input: "$videoLikes",
              as: "like",
              cond: { $eq: ["$$like.type", "dislike"] },
            },
          },
        },
        owner: {
          fullName: "$ownerDetails.fullName",
          avater: "$ownerDetails.avater",
        },
      },
    },

    // Hide raw arrays
    {
      $project: {
        videoLikes: 0,
        ownerDetails: 0,
      },
    },
  ]);

  if (!videos || videos.length === 0) {
    throw new ApiError(400, "No video found");
  }

  res.json(
    new ApiResponse(
      200,
      videos,
      "Channel videos with like/dislike counts and owner details"
    )
  );
});

export { getChannelStats, getChannelVideos };
