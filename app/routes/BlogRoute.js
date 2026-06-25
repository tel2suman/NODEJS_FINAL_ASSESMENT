const express = require("express");

const BlogController = require("../controllers/BlogController");

const Upload = require("../utils/CloudinaryImageUpload");

const authCheck = require("../middleware/authCheck");

const Rolechek = require("../middleware/roleCheck");

const router = express.Router();

// single endpoint blog crud route

router.all(
  "/blog", authCheck,
  Rolechek("Author", "Admin"),
  Upload.single("image"),
  BlogController.blogOperations,
);

router.all(
  "/blog/:blogId", authCheck,
  Rolechek("Author", "Admin"),
  Upload.single("image"), // multer
  BlogController.blogOperations,
);

// end of single endpoint

//approve blog
router.put(
  "/blog/approve/:blogId",
  authCheck,
  Rolechek("Admin"), BlogController.approveBlog,
);

// reject blog
router.put(
  "/blog/reject/:blogId",
  authCheck,
  Rolechek("Admin"), BlogController.rejectBlog,
);

// blogs by category
router.get(
  "/blog/by/category",
  authCheck,
  Rolechek("Admin"), BlogController.getBlogsByCategory,
);

router.post(
  "/like-add",
  authCheck,
  Rolechek("User"), BlogController.toggleLike,
);

router.get(
  "/all-like",
  authCheck, Rolechek("User"), BlogController.getLikesCountByBlog,
);

router.post(
  "/comment-add",
  authCheck,
  Rolechek("User"),
  BlogController.addComment,
);

router.get(
  "/comment-blog/:blogId",
  authCheck,
  Rolechek("User"),
  BlogController.getCommentsByBlog,
);

module.exports = router;