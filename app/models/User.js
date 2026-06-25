const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter valid email"],
    },

    phone: {
      type: String,
      trim: true,
      required: true,
    },

    password: {
      type: String,
      minlength: 10,
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

    role: {
      type: String,
      enum: ["Admin", "Author", "User"],
      default: "User",
    },

    is_verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const UserModel = mongoose.model("User", UserSchema);

module.exports = UserModel;
