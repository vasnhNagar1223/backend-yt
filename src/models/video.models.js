import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    videoFiles: {type: String, required: true}, //cloudnary
    thumbnail: {
      type: String, //cloudnary
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    durations: {
      type: Number, //cloudnary
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {timestamps: true}
);

export const Video = mongoose.model("Video", videoSchema);
