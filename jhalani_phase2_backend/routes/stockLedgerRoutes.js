const express = require("express");

const router = express.Router();

const {
  getStockLedger,
  getVariantLedger,
} = require("../controllers/stockLedgerController");

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
ALL STOCK LEDGER
============================================================
*/

router.get(
  "/",
  authenticate,
  getStockLedger
);


/*
============================================================
VARIANT LEDGER
============================================================
*/

router.get(
  "/variant/:variantId",
  authenticate,
  getVariantLedger
);


module.exports = router;