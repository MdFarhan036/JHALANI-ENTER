const { pool } = require("../db");

/* ============================================================
   GET ALL NOTIFICATIONS
   ============================================================ */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `
      SELECT
        id,
        user_id,
        title,
        message,
        notification_type,
        reference_type,
        reference_id,
        is_read,
        read_at,
        created_at,
        updated_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [userId]
    );

    res.json({
      success: true,
      notifications: rows,
    });
  } catch (error) {
    console.error("❌ Get notifications error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

/* ============================================================
   UNREAD COUNT
   ============================================================ */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM notifications
      WHERE user_id = ?
        AND is_read = 0
      `,
      [userId]
    );

    res.json({
      success: true,
      count: Number(rows[0]?.count || 0),
    });
  } catch (error) {
    console.error("❌ Unread notification count error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get unread notification count",
    });
  }
};

/* ============================================================
   CREATE NOTIFICATION
   ============================================================ */
exports.createNotification = async (req, res) => {
  try {
    const {
      user_id,
      title,
      message,
      notification_type = "INFO",
      reference_type = null,
      reference_id = null,
    } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "title and message are required",
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO notifications
      (
        user_id,
        title,
        message,
        notification_type,
        reference_type,
        reference_id
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        user_id,
        title,
        message,
        notification_type,
        reference_type,
        reference_id,
      ]
    );

    const [rows] = await pool.query(
      `
      SELECT *
      FROM notifications
      WHERE id = ?
      `,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      notification: rows[0],
    });
  } catch (error) {
    console.error("❌ Create notification error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create notification",
    });
  }
};

/* ============================================================
   MARK ONE AS READ
   ============================================================ */
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const [result] = await pool.query(
      `
      UPDATE notifications
      SET
        is_read = 1,
        read_at = NOW()
      WHERE id = ?
        AND user_id = ?
      `,
      [notificationId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("❌ Mark notification read error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
};

/* ============================================================
   MARK ALL AS READ
   ============================================================ */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(
      `
      UPDATE notifications
      SET
        is_read = 1,
        read_at = NOW()
      WHERE user_id = ?
        AND is_read = 0
      `,
      [userId]
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("❌ Mark all notifications read error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
};

/* ============================================================
   DELETE NOTIFICATION
   ============================================================ */
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const [result] = await pool.query(
      `
      DELETE FROM notifications
      WHERE id = ?
        AND user_id = ?
      `,
      [notificationId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete notification error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};