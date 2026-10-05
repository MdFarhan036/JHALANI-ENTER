
const express = require("express");

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
} = require("../controllers/productController");

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| PRODUCT ROUTES
|--------------------------------------------------------------------------
*/

router.get("/", authenticate, getProducts);

router.get("/:id", authenticate, getProductById);

router.post("/", authenticate, createProduct);

router.put("/:id", authenticate, updateProduct);

router.patch(
  "/:id/status",
  authenticate,
  updateProductStatus
);

router.delete(
  "/:id",
  authenticate,
  deleteProduct
);

module.exports = router;