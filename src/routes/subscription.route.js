import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// Toggle subscription
router.post("/toggle/:channelId", toggleSubscription);

// Get all subscribers of a channel
router.get("/channel/:channelId", getUserChannelSubscribers);

// Get all channels a user has subscribed to
router.get("/user/:userId", getSubscribedChannels);

export default router;
