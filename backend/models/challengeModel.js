import mongoose from "mongoose";

const challengeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    challengeType: {
      type: String,
      enum: ["daily_save", "category_fast", "spend_limit"],
      required: true,
    },
    targetValue: {
      type: Number,
      required: true,
    },
    categoryLimit: {
      type: String,
      default: "",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    streak: {
      type: Number,
      default: 0,
    },
    maxStreak: {
      type: Number,
      default: 0,
    },
    progress: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "completed", "failed"],
      default: "active",
    },
    earnedBadges: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("challenge", challengeSchema);
