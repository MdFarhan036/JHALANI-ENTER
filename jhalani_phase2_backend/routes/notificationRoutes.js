const express = require("express");

const router = express.Router();

const notificationController = require("../controllers/notificationController");
const { authenticate } = require("../middleware/authMiddleware");

/* ============================================================
   NOTIFICATIONS
   ============================================================ */

router.get(
  "/",
  authenticate,
  notificationController.getNotifications
);

router.get(
  "/unread-count",
  authenticate,
  notificationController.getUnreadCount
);

router.post(
  "/",
  authenticate,
  notificationController.createNotification
);

router.patch(
  "/:id/read",
  authenticate,
  notificationController.markAsRead
);

router.patch(
  "/read-all",
  authenticate,
  notificationController.markAllAsRead
);

router.delete(
  "/:id",
  authenticate,
  notificationController.deleteNotification
);

module.exports = router;