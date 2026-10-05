const express = require("express");

const router = express.Router();

const {
  getPurchases,
  getPurchaseById,
  createPurchase,
  completePurchase,
  cancelPurchase,
} = require("../controllers/purchaseController");

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
PURCHASE LIST
============================================================
*/

router.get(
  "/",
  authenticate,
  getPurchases
);


/*
============================================================
SINGLE PURCHASE
============================================================
*/

router.get(
  "/:id",
  authenticate,
  getPurchaseById
);


/*
============================================================
CREATE PURCHASE
============================================================
*/

router.post(
  "/",
  authenticate,
  createPurchase
);


/*
============================================================
COMPLETE PURCHASE
============================================================
*/

router.put(
  "/:id/complete",
  authenticate,
  completePurchase
);


/*
============================================================
CANCEL PURCHASE
============================================================
*/

router.put(
  "/:id/cancel",
  authenticate,
  cancelPurchase
);


module.exports = router;