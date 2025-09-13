import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  const userId = req.user._id;
  if (!channelId) {
    throw new ApiError(400, "Channel id is required");
  }

  if (channelId === String(userId)) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "You cannot subscribe to yourself"));
  }
  // Check if subscription already exists
  const existingSub = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });

  let message = "";
  if (existingSub) {
    // If already subscribed, then unsubscribe
    await Subscription.findByIdAndDelete(existingSub._id);
    message = "Unsubscribed successfully";
  } else {
    // Otherwise, subscribe
    await Subscription.create({
      subscriber: userId,
      channel: channelId,
    });
    message = "Subscribed successfully";
  }

  res.json(new ApiResponse(200, {}, message));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  // Find all subscriptions where this channel is being followed
  const subscribers = await Subscription.find({
    channel: subscriberId,
  })
    .populate("subscriber", "username fullName avatar") // Include any other fields you want
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        total: subscribers.length,
        subscribers,
      },
      "Subscriber list fetched successfully"
    )
  );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const subscribedChannels = await Subscription.find({
    subscriber: channelId,
  })
    .populate("channel", "username fullName avatar") // Add any channel fields you want
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { total: subscribedChannels.length, channels: subscribedChannels },
        "Subscribed channels fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
