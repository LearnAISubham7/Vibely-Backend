import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user._id;

  if (!channelId) throw new ApiError(400, "Channel id is required");

  if (channelId === String(userId)) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "You cannot subscribe to yourself"));
  }

  const existingSub = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });

  let isSubscribed, message;

  if (existingSub) {
    await Subscription.findByIdAndDelete(existingSub._id);
    isSubscribed = false;
    message = "Unsubscribed successfully";
  } else {
    await Subscription.create({ subscriber: userId, channel: channelId });
    isSubscribed = true;
    message = "Subscribed successfully";
  }

  // 👇 Always return updated subscriber count
  const subscriberCount = await Subscription.countDocuments({
    channel: channelId,
  });

  res
    .status(200)
    .json(new ApiResponse(200, { isSubscribed, subscriberCount }, message));
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const subscribers = await Subscription.find({ channel: channelId })
    .populate("subscriber", "username fullName avater")
    .sort({ createdAt: -1 });

  const mySubscriptions = await Subscription.find({ subscriber: req.user._id });
  const mySubscribedChannelIds = new Set(
    mySubscriptions.map((sub) => sub.channel.toString())
  );

  // Add isSubscribed flag for each follower
  const result = subscribers.map((sub) => ({
    ...sub.subscriber.toObject(),
    isSubscribed: mySubscribedChannelIds.has(sub.subscriber._id.toString()),
  }));

  res.status(200).json(
    new ApiResponse(
      200,
      {
        total: subscribers.length,
        subscribers: result,
      },
      "Subscribers fetched successfully"
    )
  );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { userId } = req.params; // <- adjust to match your route

  const subscribedChannels = await Subscription.find({
    subscriber: userId,
  })
    .populate("channel", "username fullName avater") // populate channel info
    .sort({ createdAt: -1 });

  // add subscriberCount for each channel
  const channelsWithCount = await Promise.all(
    subscribedChannels.map(async (sub) => {
      const count = await Subscription.countDocuments({
        channel: sub.channel._id,
      });
      return {
        ...sub.channel.toObject(),
        subscriberCount: count,
      };
    })
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { total: channelsWithCount.length, channels: channelsWithCount },
        "Subscribed channels fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
