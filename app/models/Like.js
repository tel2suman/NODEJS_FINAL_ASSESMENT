const mongoose = require("mongoose");

const LikeSchema = new mongoose.Schema(
  {
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// 🔥 Prevent duplicate likes (same author cannot like same blog twice)
LikeSchema.index({ blogId: 1, userId: 1 }, { unique: true });

const Like = mongoose.model("Like", LikeSchema);

module.exports = Like;
