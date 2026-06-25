const User = require("../models/User");

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const cloudinary = require("../config/cloudinary");

const fs = require("fs");

const SendEmail = require("../utils/SendEmail");

const StatusCode = require("../utils/StatusCode");

const OTPModel = require("../models/OTPModel");

class UserController {
  async registerUser(req, res) {
    try {
      const { name, email, phone, password, role } = req.body;

      if (!name || !email || !phone || !password) {
        return res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "all fields are required",
        });
      }

      if (!req.file) {
        return res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Image is required",
        });
      }

      const existUser = await User.findOne({ email });

      if (existUser) {
        return res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "user already exist",
        });
      }

      //upload to clodinary
      const imageResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "uploads",
        width: 500,
        height: 500,
        crop: "limit",
        quality: "auto",
      });

      // Delete local file after upload (important)
      if (req.file && req.file.path) {
        await fs.promises.unlink(req.file.path);
      }

      const salt = await bcrypt.genSalt(10);

      const hashedpassword = await bcrypt.hash(password, salt);

      const userdata = new User({
        name,
        email,
        phone,
        password: hashedpassword,
        image: imageResult ? imageResult.secure_url : null,
        cloudinary_id: imageResult ? imageResult.public_id : null,
        role,
      });

      const data = await userdata.save();

      await SendEmail(req, data);

      return res.status(StatusCode.SUCCESS).json({
        success: true,
        message: "user registered successfully & please verify your email",
        data: data,
      });
    } catch (error) {
      return res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
  }

  //user verified
  async verifyUser(req, res) {
    try {
      const { email, otp } = req.body;

      // Check if all required fields are provided
      if (!email || !otp) {
        return res
          .status(StatusCode.BAD_REQUEST)
          .json({ status: false, message: "All fields are required" });
      }
      const existingUser = await User.findOne({ email });

      // Check if email doesn't exists
      if (!existingUser) {
        return res
          .status(StatusCode.NOT_FOUND)
          .json({ status: "failed", message: "Email doesn't exists" });
      }

      // Check if email is already verified
      if (existingUser.is_verified) {
        return res
          .status(StatusCode.BAD_REQUEST)
          .json({ status: false, message: "Email is already verified" });
      }
      // Check if there is a matching email verification OTP
      const emailVerification = await OTPModel.findOne({
        UserId: existingUser._id,
        otp,
      });
      if (!emailVerification) {
        if (!existingUser.is_verified) {
          // console.log(existingUser);
          await SendEmail(req, existingUser);
          return res.status(StatusCode.BAD_REQUEST).json({
            status: false,
            message: "Invalid OTP, new OTP sent to your email",
          });
        }
        return res
          .status(StatusCode.BAD_REQUEST)
          .json({ status: false, message: "Invalid OTP" });
      }
      // Check if OTP is expired
      const currentTime = new Date();
      // 15 * 60 * 1000 calculates the expiration period in milliseconds(15 minutes).
      const expirationTime = new Date(
        emailVerification.createdAt.getTime() + 5 * 60 * 1000,
      );
      if (currentTime > expirationTime) {
        // OTP expired, send new OTP
        await SendEmail(req, existingUser);
        return res.status(StatusCode.BAD_REQUEST).json({
          status: "failed",
          message: "OTP expired, new OTP sent to your email",
        });
      }
      // OTP is valid and not expired, mark email as verified
      existingUser.is_verified = true;

      await existingUser.save();

      // Delete email verification document
      await OTPModel.deleteMany({ UserId: existingUser._id });
      return res.status(StatusCode.SUCCESS).json({
        status: true,
        message: "Email verified successfully, Please Login!!",
      });
    } catch (error) {
      console.error(error);
      res.status(StatusCode.SERVER_ERROR).json({
        status: false,
        message: "Unable to verify email, please try again later",
      });
    }
  }

  async loginUser(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "all fields are required",
        });
      }

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "user not found",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "password does not match",
        });
      }

      if (!user.is_verified) {
        return res.status(StatusCode.BAD_REQUEST).json({
          status: false,
          message: "Your account is not verified",
        });
      }

      if (user) {
        const token = jwt.sign(
          {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
          },
          process.env.JWT_SECRET_KEY,
          { expiresIn: "1d" },
        );

        return res.status(StatusCode.SUCCESS).json({
          success: true,
          message: "user login successfull!!",
          data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
          },
          token: token,
        });
      } else {
        return res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "user not found",
        });
      }
    } catch (error) {
      return res.status(StatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // select user
  async getUserProfile(req, res) {
    try {
      const id = req.params.id;

      const data = await User.findById(id);

      return res.status(StatusCode.SUCCESS).json({
        success: true,
        message: "get user",
        data: data,
      });
    } catch (error) {
      return res.status(StatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // update user
  async updateUser(req, res) {
    try {
      const id = req.params.id;

      if (!id) {
        return res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "user id is required",
        });
      }

      // 1. Get existing user first
      const existingUser = await User.findById(id);

      if (!existingUser) {
        return res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: "user not found",
        });
      }

      let updateData = { ...req.body };

      // 2. Handle image update
      if (req.file) {
        // delete old image safely
        if (existingUser.image) {
          try {
            await fs.promises.unlink(existingUser.image);

            console.log("Old image deleted successfully");
          } catch (error) {
            console.log("Error deleting old image:", error.message);
          }
        }

        updateData.image = req.file.path;
      }

      // 3. Update user
      const updatedUser = await User.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      return res.status(StatusCode.SUCCESS).json({
        success: true,
        message: "user profile updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      return res.status(StatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}



module.exports = new UserController();