const express = require("express");

const router = express.Router();

const {
  getPurchasesForReturn,
  getPurchaseItemsForReturn,
  createPurchaseReturn,
  completePurchaseReturn,
  getPurchaseReturns,
} = require("../controllers/purchaseReturnController");

const authMiddleware = require("../middleware/authMiddleware");

const authenticate =
  typeof authMiddleware === "function"
    ? authMiddleware
    : authMiddleware.authenticate;

if (typeof authenticate !== "function") {
  throw new Error(
    "Authentication middleware is not exported correctly"
  );
}


/*
============================================================
PURCHASE RETURNS
============================================================
*/

router.get(
  "/",
  authenticate,
  getPurchaseReturns
);


/*
============================================================
COMPLETED PURCHASES AVAILABLE FOR RETURN
============================================================
*/

router.get(
  "/purchases",
  authenticate,
  getPurchasesForReturn
);


/*
============================================================
PURCHASE ITEMS
============================================================
*/

router.get(
  "/purchases/:purchaseId/items",
  authenticate,
  getPurchaseItemsForReturn
);


/*
============================================================
CREATE RETURN
============================================================
*/

router.post(
  "/",
  authenticate,
  createPurchaseReturn
);


/*
============================================================
COMPLETE RETURN
============================================================
*/

router.put(
  "/:id/complete",
  authenticate,
  completePurchaseReturn
);


module.exports = router;