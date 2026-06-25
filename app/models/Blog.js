const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const BlogSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
    },

    content: {
      type: String,
      trim: true,
      required: true,
    },

    image: {
      type: String,
      default: "default.jpg",
    },

    cloudinary_id: {
      type: String,
      default: "ai-generated-8569065_1280.jpg",
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    createdOn: {
      type: Date,
      default: new Date(),
    },

    updatedOn: {
      type: Date,
      default: new Date(),
    },
  },
  {
    versionKey: false,
  },
);

const BlogModel = mongoose.model("Blog", BlogSchema);

module.exports = BlogModel;
