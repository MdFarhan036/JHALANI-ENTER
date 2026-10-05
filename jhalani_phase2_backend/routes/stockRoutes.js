const express = require("express");

const router = express.Router();

const {
  getStock,
  getVariantStock,
  getStockHistory,
  createStockTransaction,
} = require("../controllers/stockController");

const authMiddleware = require("../middleware/authMiddleware");

/*
============================================================
AUTH MIDDLEWARE
============================================================
*/

const authenticate =
  typeof authMiddleware === "function"
    ? authMiddleware
    : authMiddleware.authenticate;

/*
============================================================
SAFETY CHECK
============================================================
*/

if (typeof authenticate !== "function") {
  throw new Error(
    "Authentication middleware is not exported correctly from authMiddleware.js"
  );
}

/*
============================================================
CURRENT STOCK
============================================================
*/

router.get(
  "/",
  authenticate,
  getStock
);

/*
============================================================
STOCK HISTORY
============================================================
*/

router.get(
  "/history",
  authenticate,
  getStockHistory
);

/*
============================================================
VARIANT STOCK
============================================================
*/

router.get(
  "/variant/:variantId",
  authenticate,
  getVariantStock
);

/*
============================================================
CREATE STOCK TRANSACTION
============================================================
*/

router.post(
  "/transactions",
  authenticate,
  createStockTransaction
);

module.exports = router;