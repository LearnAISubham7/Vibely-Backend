import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const content = req.body.content;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const tweet = await Tweet.create({
    owner: req.user?._id,
    content,
  });

  if (!tweet) {
    throw new ApiError(401, "Something went wrong while creating tweet");
  }

  const populatedTweet = await Tweet.findById(tweet._id)
    .populate("owner", "fullName avater")
    .sort({ createdAt: -1 });

  res.json(new ApiResponse(200, populatedTweet, "tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { username } = req.params;
  const userId = req?.user?._id;

  const user = await User.findOne({ username });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const tweets = await Tweet.find({ owner: user._id })
    .populate("owner", "fullName avater")
    .sort({ createdAt: -1 });

  const enrichedTweets = await Promise.all(
    tweets.map(async (tweet) => {
      const [likeCount, dislikeCount, userReactionDoc] = await Promise.all([
        Like.countDocuments({ tweet: tweet._id, type: "like" }),
        Like.countDocuments({ tweet: tweet._id, type: "dislike" }),
        userId ? Like.findOne({ tweet: tweet._id, likedBy: userId }) : null,
      ]);

      return {
        ...tweet.toObject(),
        likeCount,
        dislikeCount,
        userReaction: userReactionDoc ? userReactionDoc.type : null,
      };
    })
  );
  res.json(
    new ApiResponse(
      200,
      {
        tweets: enrichedTweets,
      },
      "User Tweets fetched successfully"
    )
  );
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const content = req.body.content;

  if (!tweetId && !content) {
    throw new ApiError(400, "tweet id and content is required");
  }

  const tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  )
    .populate("owner", "fullName avater")
    .sort({ createdAt: -1 });

  res.json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  await Tweet.findByIdAndDelete(tweetId);
  res.json(new ApiResponse(200, {}, "tweet delete successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
