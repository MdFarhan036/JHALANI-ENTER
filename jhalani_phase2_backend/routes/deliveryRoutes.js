const express = require("express");

const router = express.Router();

const deliveryController = require("../controllers/deliveryController");

/* ============================================================
   DELIVERY LIST
============================================================ */

router.get(
  "/",
  deliveryController.getDeliveries
);

router.get(
  "/ready",
  deliveryController.getReadyDeliveries
);


/* ============================================================
   DELIVERY DETAILS
============================================================ */

router.get(
  "/:id",
  deliveryController.getDeliveryById
);


/* ============================================================
   ASSIGN DELIVERY
============================================================ */

router.post(
  "/assign",
  deliveryController.assignDelivery
);


/* ============================================================
   DELIVERY STATUS
============================================================ */

router.put(
  "/:id/status",
  deliveryController.updateDeliveryStatus
);


/* ============================================================
   DELIVERY OTP
============================================================ */

router.post(
  "/:id/generate-otp",
  deliveryController.generateDeliveryOTP
);

router.post(
  "/:id/verify-otp",
  deliveryController.verifyDeliveryOTP
);


/* ============================================================
   DELIVERY TRACKING
============================================================ */

router.get(
  "/:id/tracking",
  deliveryController.getDeliveryTracking
);

router.post(
  "/:id/tracking",
  deliveryController.addDeliveryTracking
);

module.exports = router;