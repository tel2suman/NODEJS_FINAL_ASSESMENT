const Category = require("../models/Category");

const StatusCode = require("../utils/StatusCode");

class CategoryController {
  async createCategory(req, res) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Category name is required",
        });
      }

      const exist = await Category.findOne({ name });

      if (exist) {
        return res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Category already exists",
        });
      }

      const category = await Category.create({
        name,
        description,
      });

      return res.status(StatusCode.SUCCESS).json({
        success: true,
        message: "Category created",
        data: category,
      });
    } catch (error) {
      return res.status(StatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getCategories(req, res) {
    try {
      const data = await Category.find({ isActive: true });

      return res.status(StatusCode.SUCCESS).json({
        success: true,
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

  async updateCategory(req, res) {
    try {
      const { categoryId } = req.params;

      const { name, description } = req.body;

      const category = await Category.findByIdAndUpdate(
        categoryId,
        { name, description },
        { new: true },
      );

      if (!category) {
        return res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: "Category not found",
        });
      }

      return res.status(StatusCode.SUCCESS).json({
        success: true,
        message: "Category updated",
        data: category,
      });
    } catch (error) {
      return res.status(StatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteCategory(req, res) {
    try {
      const { categoryId } = req.params;

      if (!categoryId) {
        return res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "oops, id required!",
        });
      }

      const category = await Category.findByIdAndDelete(categoryId);

      return res.status(StatusCode.SUCCESS).json({
        success: true,
        message: "Category deactivated",
      });
    } catch (error) {
      return res.status(StatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}


module.exports = new CategoryController();