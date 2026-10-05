const express = require("express");

const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  deleteCategory,
} = require("../controllers/categoryController");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Category Routes
|--------------------------------------------------------------------------
*/

// Get all categories
router.get("/", getCategories);

// Get single category
router.get("/:id", getCategoryById);

// Create category
router.post("/", createCategory);

// Update category
router.put("/:id", updateCategory);

// Update status
router.patch("/:id/status", updateCategoryStatus);

// Delete category
router.delete("/:id", deleteCategory);

module.exports = router;