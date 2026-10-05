const express = require("express");
const router = express.Router();

const {
  getVariants,
  getVariantById,
  createVariant,
  updateVariant,
  deleteVariant,
} = require("../controllers/productVariantController");

const { authenticate } = require("../middleware/authMiddleware");

/* ============================================================
   PRODUCT VARIANT ROUTES
   ============================================================ */

// Get all variants
router.get("/", authenticate, getVariants);

// Get single variant
router.get("/:id", authenticate, getVariantById);

// Create variant
router.post("/", authenticate, createVariant);

// Update variant
router.put("/:id", authenticate, updateVariant);

// Delete variant
router.delete("/:id", authenticate, deleteVariant);

module.exports = router;