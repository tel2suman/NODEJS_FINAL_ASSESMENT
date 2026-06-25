const Blog = require("../models/Blog");

const Comment = require("../models/Comment");

const Like = require("../models/Like");

const cloudinary = require("../config/cloudinary");

const fs = require("fs");

const mongoose = require("mongoose");

const StatusCode = require("../utils/StatusCode");


class BlogController {
  async blogOperations(req, res) {
    try {
      const method = req.method;

      switch (method) {
        //POST → create
        case "POST": {
          const { title, content, userId, categoryId } = req.body;

          //validate all fields
          if (!title || !content || !userId || !categoryId) {
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

          const existPost = await Blog.findOne({ title });

          if (existPost) {
            return res.status(StatusCode.BAD_REQUEST).json({
              success: false,
              message: "blog already exist",
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

          const blogdata = new Blog({
            title,
            content,
            image: imageResult ? imageResult.secure_url : null,
            cloudinary_id: imageResult ? imageResult.public_id : null,
            userId,
            categoryId,
          });

          const data = await blogdata.save();

          // Your record creation logic here
          return res.status(StatusCode.SUCCESS).json({
            success: true,
            message: "Blog created successfully.",
            data: data,
          });
        }

        //GET → get all blogs
        case "GET": {
          const data = await Blog.find();

          return res.status(StatusCode.SUCCESS).json({
            success: true,
            message: "blog listing is here",
            total: data.length,
            data: data,
          });
        }

        //PUT → update
        case "PUT": {
          const { blogId } = req.params;

          const { title, content } = req.body;

          const blog = await Blog.findById(blogId);

          if (!blog) {
            return res.status(StatusCode.NOT_FOUND).json({
              success: false,
              message: "Blog not found",
            });
          }

          // 🔐 Ownership check
          if (blog.authorId !== req.user.id) {
            return res.status(StatusCode.BAD_REQUEST).json({
              success: false,
              message: "You are not allowed to update this blog",
            });
          }

          // 🖼️ If new image uploaded
          if (req.file) {
            // ✅ Delete old image from Cloudinary
            if (blog.cloudinary_id) {
              await cloudinary.uploader.destroy(blog.cloudinary_id);
            }

            // ✅ Upload new image
            const result = await cloudinary.uploader.upload(req.file.path, {
              folder: "uploads",
              width: 500,
              height: 500,
              crop: "limit",
              quality: "auto",
            });

            // ✅ Remove local file
            if (req.file.path) {
              await fs.promises.unlink(req.file.path);
            }

            // ✅ Update image fields
            blog.image = result.secure_url;
            blog.cloudinary_id = result.public_id;
          }

          // 📝 Update text fields
          if (title) blog.title = title;

          if (content) blog.content = content;

          await blog.save();

          return res.status(StatusCode.SUCCESS).json({
            success: true,
            message: "Blog updated successfully",
            data: blog,
          });
        }

        //DELETE → delete
        case "DELETE": {
          const { blogId } = req.params;

          const blog = await Blog.findById(blogId);

          if (!blog) {
            return res.status(404).json({
              success: false,
              message: "Blog not found",
            });
          }

          // 🔐 Ownership check
          if (blog.authorId !== req.user.id) {
            return res.status(403).json({
              success: false,
              message: "You are not allowed to delete this blog",
            });
          }

          // 🖼️ Delete image from Cloudinary (safe)
          if (blog.cloudinary_id) {
            try {
              await cloudinary.uploader.destroy(blog.cloudinary_id);
            } catch (err) {
              console.log("Cloudinary delete failed:", err.message);
              // ❗ don't stop execution
            }
          }

          // 🗑️ Delete blog
          await Blog.findByIdAndDelete(blogId);

          return res.status(StatusCode.SUCCESS).json({
            success: true,
            message: "Blog and image deleted successfully",
          });
        }
      }
    } catch (error) {
      return res.status(StatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  async approveBlog(req, res) {
    try {
      const { blogId } = req.params;

      const blog = await Blog.findById(blogId);

      if (!blog) {
        return res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: "Blog not found",
        });
      }

      blog.status = "approved";

      await blog.save();

      return res.status(StatusCode.SUCCESS).json({
        success: true,
        message: "Blog approved successfully",
        data: blog,
      });
    } catch (error) {
      return res.status(StatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  async rejectBlog(req, res) {
    try {
      const { blogId } = req.params;

      const blog = await Blog.findById(blogId);

      if (!blog) {
        return res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: "Blog not found",
        });
      }

      blog.status = "rejected";

      await blog.save();

      return res.status(StatusCode.SUCCESS).json({
        success: true,
        message: "Blog rejected",
        data: blog,
      });
    } catch (error) {
      return res.status(StatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getBlogsByCategory(req, res) {
    try {
      const lookupQuery = [
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },
        {
          $group: { _id: "$categoryId", total: { $sum: 1 } },
        },
      ];

      const result = await Blog.aggregate(lookupQuery);

      return res.status(StatusCode.SUCCESS).json({
        message: "Blogs fetched by category",
        data: result,
      });
    } catch (error) {
      return res.status(StatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  async toggleLike(req, res) {
    try {
      const { blogId } = req.body;

      const userId = req.user.id; // 🔐 from auth

      if (!blogId) {
        return res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "blogId is required",
        });
      }

      const existingLike = await Like.findOne({ blogId, userId });

      if (existingLike) {
        await Like.deleteOne({ _id: existingLike._id });

        return res.status(StatusCode.SUCCESS).json({
          success: true,
          message: "Blog unliked",
        });
      }

      await Like.create({ blogId, userId });

      return res.status(StatusCode.SUCCESS).json({
        success: true,
        message: "Blog liked",
      });
    } catch (error) {
      return res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getLikesCountByBlog(req, res) {
    try {
      const lookupQuery = [
        {
          $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "blogId",
            as: "likes",
          },
        },
        {
          $addFields: {
            likeCount: { $size: "$likes" },
          },
        },
        {
          $project: {
            title: 1,
            likeCount: 1,
          },
        },
      ];

      const data = await Blog.aggregate(lookupQuery);

      return res.status(StatusCode.SUCCESS).json({
        success: true,
        message: "Likes fetched successfully",
        total: data.length,
        data,
      });
    } catch (error) {
      return res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
  }

  async addComment(req, res) {
    try {
      const { blogId, comment } = req.body;

      if (!blogId || !comment) {
        return res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "blogId and comment are required",
        });
      }

      // check blog exists
      const blog = await Blog.findById(blogId);

      if (!blog) {
        return res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: "Blog not found",
        });
      }

      const newComment = await Comment.create({
        blogId,
        userId: req.user.id, // 🔐 from auth
        comment,
      });

      return res.status(StatusCode.SUCCESS).json({
        success: true,
        message: "Comment added successfully",
        data: newComment,
      });
    } catch (error) {
      return res.status(StatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getCommentsByBlog(req, res) {
    try {
      const { blogId } = req.params;

      const lookupQuery = [
        {
          $match: {
            blogId: new mongoose.Types.ObjectId(blogId),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: "$userDetails",
        },
        {
          $project: {
            comment: 1,
            createdAt: 1,
            "userDetails.name": 1,
            "userDetails.email": 1,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ];

      const data = await Comment.aggregate(lookupQuery);

      return res.status(StatusCode.SUCCESS).json({
        success: true,
        message: "Comments fetched successfully",
        total: data.length,
        data,
      });
    } catch (error) {
      return res.status(StatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new BlogController();
