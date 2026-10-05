const express = require("express");

const router = express.Router();

const {
  getOrders,
  getOrderById,
  createOrder,
  confirmOrder,
} = require("../controllers/orderController");

const authMiddleware =
  require("../middleware/authMiddleware");

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
SALES ORDERS
============================================================
*/

// GET /api/orders
router.get(
  "/",
  authenticate,
  getOrders
);


// GET /api/orders/:id
router.get(
  "/:id",
  authenticate,
  getOrderById
);


// POST /api/orders
router.post(
  "/",
  authenticate,
  createOrder
);


// PUT /api/orders/:id/confirm
router.put(
  "/:id/confirm",
  authenticate,
  confirmOrder
);


module.exports = router;