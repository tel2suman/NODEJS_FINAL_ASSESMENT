const express = require("express");

const router = express.Router();

const UserRoute = require("./UserRoute");

const CategoryRoute = require("./CategoryRoute");

const BlogRoute = require("./BlogRoute");

router.use(UserRoute);

router.use(CategoryRoute);

router.use(BlogRoute);

module.exports = router;