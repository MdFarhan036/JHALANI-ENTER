const express = require("express");

const router = express.Router();

const {
  getDispatches,
  getDispatchById,
  getPendingOrders,
  getPendingOrderItems,
  createDispatch,
  updateDispatchStatus,
} = require("../controllers/dispatchController");

const authMiddleware = require("../middleware/authMiddleware");

const authenticate =
  typeof authMiddleware === "function"
    ? authMiddleware
    : authMiddleware.authenticate;

if (typeof authenticate !== "function") {
  throw new Error(
    "Authentication middleware is not exported correctly from authMiddleware.js"
  );
};


/*
============================================================
DISPATCH LIST
============================================================
*/

router.get(
  "/",
  authenticate,
  getDispatches
);


/*
============================================================
PENDING ORDERS
============================================================
*/

router.get(
  "/pending-orders",
  authenticate,
  getPendingOrders
);


/*
============================================================
PENDING ITEMS FOR ORDER
============================================================
*/

router.get(
  "/order/:orderId/pending",
  authenticate,
  getPendingOrderItems
);


/*
============================================================
SINGLE DISPATCH
============================================================
*/

router.get(
  "/:id",
  authenticate,
  getDispatchById
);


/*
============================================================
CREATE DISPATCH
============================================================
*/

router.post(
  "/",
  authenticate,
  createDispatch
);


/*
============================================================
UPDATE STATUS
============================================================
*/

router.put(
  "/:id/status",
  authenticate,
  updateDispatchStatus
);


module.exports = router;