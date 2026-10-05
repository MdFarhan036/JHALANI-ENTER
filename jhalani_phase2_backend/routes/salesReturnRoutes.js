const express = require("express");

const router = express.Router();

const {
  getSalesReturns,
  getSalesReturnById,
  getReturnableOrders,
  getReturnableOrderItems,
  createSalesReturn,
  updateSalesReturn,
  completeSalesReturn,
  cancelSalesReturn,
} = require("../controllers/salesReturnController");


/*
============================================================
SALES RETURNS
============================================================
*/

router.get(
  "/",
  getSalesReturns
);

router.get(
  "/:id",
  getSalesReturnById
);


/*
============================================================
RETURNABLE ORDERS
============================================================
*/

router.get(
  "/orders/list",
  getReturnableOrders
);

router.get(
  "/orders/:orderId/items",
  getReturnableOrderItems
);


/*
============================================================
CREATE / UPDATE
============================================================
*/

router.post(
  "/",
  createSalesReturn
);

router.put(
  "/:id",
  updateSalesReturn
);


/*
============================================================
COMPLETE / CANCEL
============================================================
*/

router.put(
  "/:id/complete",
  completeSalesReturn
);

router.put(
  "/:id/cancel",
  cancelSalesReturn
);

module.exports = router;