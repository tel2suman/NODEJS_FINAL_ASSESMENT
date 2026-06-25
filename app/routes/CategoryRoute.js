const express = require("express");

const CategoryController = require("../controllers/CategoryController");

const authCheck = require("../middleware/authCheck");

const Rolechek = require("../middleware/roleCheck");

const router = express.Router();

router.post(
  "/create-category",
  authCheck,
  Rolechek("Author"), CategoryController.createCategory,
);

router.get(
  "/view-category",
  authCheck,
  Rolechek("Author"),
  CategoryController.getCategories,
);

router.put(
  "/update-category/:categoryId",
  authCheck,
  Rolechek("Author"),
  CategoryController.updateCategory,
);

router.delete(
  "/delete-category/:categoryId",
  authCheck,
  Rolechek("Author"),
  CategoryController.deleteCategory,
);


module.exports = router;