import { model, Schema } from "mongoose";

const likeSchema = Schema(
  {
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet",
    },
    type: {
      type: String,
      enum: ["like", "dislike"], // 👈 can be like OR dislike
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Like = model("Like", likeSchema);
