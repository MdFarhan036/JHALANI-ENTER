const express = require("express");

const router = express.Router();

const {
  getStockAdjustments,
  getStockAdjustmentById,
  createStockAdjustment,
} = require("../controllers/stockAdjustmentController");

const authMiddleware = require("../middleware/authMiddleware");

const authenticate =
  typeof authMiddleware === "function"
    ? authMiddleware
    : authMiddleware.authenticate;

if (typeof authenticate !== "function") {
  throw new Error(
    "Authentication middleware is not exported correctly from authMiddleware.js"
  );
}


/*
============================================================
GET ALL ADJUSTMENTS
============================================================
*/

router.get(
  "/",
  authenticate,
  getStockAdjustments
);


/*
============================================================
GET SINGLE ADJUSTMENT
============================================================
*/

router.get(
  "/:id",
  authenticate,
  getStockAdjustmentById
);


/*
============================================================
CREATE ADJUSTMENT
============================================================
*/

router.post(
  "/",
  authenticate,
  createStockAdjustment
);


module.exports = router;