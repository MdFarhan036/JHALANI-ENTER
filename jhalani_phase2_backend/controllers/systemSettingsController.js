const db = require("../db");

/* ============================================================
   GET ALL SETTINGS
   GET /api/settings
   ============================================================ */

exports.getSettings = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        setting_key,
        setting_value,
        setting_group,
        description,
        status
      FROM system_settings
      WHERE status = 1
      ORDER BY setting_group, setting_key
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("GET SETTINGS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch system settings",
      error: error.message,
    });
  }
};

/* ============================================================
   GET SETTINGS BY GROUP
   GET /api/settings/group/:group
   ============================================================ */

exports.getSettingsByGroup = async (req, res) => {
  try {
    const { group } = req.params;

    const [rows] = await db.query(
      `
      SELECT
        id,
        setting_key,
        setting_value,
        setting_group,
        description,
        status
      FROM system_settings
      WHERE setting_group = ?
        AND status = 1
      ORDER BY setting_key
      `,
      [group.toUpperCase()]
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("GET SETTINGS GROUP ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch settings group",
      error: error.message,
    });
  }
};

/* ============================================================
   GET SINGLE SETTING
   GET /api/settings/:key
   ============================================================ */

exports.getSetting = async (req, res) => {
  try {
    const { key } = req.params;

    const [rows] = await db.query(
      `
      SELECT
        id,
        setting_key,
        setting_value,
        setting_group,
        description,
        status
      FROM system_settings
      WHERE setting_key = ?
      LIMIT 1
      `,
      [key]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Setting not found",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("GET SETTING ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch setting",
      error: error.message,
    });
  }
};

/* ============================================================
   UPDATE SINGLE SETTING
   PUT /api/settings/:key
   ============================================================ */

exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { setting_value } = req.body;

    if (setting_value === undefined) {
      return res.status(400).json({
        success: false,
        message: "setting_value is required",
      });
    }

    const [result] = await db.query(
      `
      UPDATE system_settings
      SET
        setting_value = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE setting_key = ?
      `,
      [String(setting_value), key]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Setting not found",
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        id,
        setting_key,
        setting_value,
        setting_group,
        description,
        status
      FROM system_settings
      WHERE setting_key = ?
      LIMIT 1
      `,
      [key]
    );

    res.json({
      success: true,
      message: "Setting updated successfully",
      data: rows[0],
    });
  } catch (error) {
    console.error("UPDATE SETTING ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update setting",
      error: error.message,
    });
  }
};

/* ============================================================
   UPDATE MULTIPLE SETTINGS
   PUT /api/settings
   ============================================================ */

exports.updateSettings = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { settings } = req.body;

    if (!Array.isArray(settings) || settings.length === 0) {
      return res.status(400).json({
        success: false,
        message: "settings must be a non-empty array",
      });
    }

    await connection.beginTransaction();

    for (const setting of settings) {
      if (!setting.setting_key) {
        continue;
      }

      await connection.query(
        `
        UPDATE system_settings
        SET
          setting_value = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = ?
        `,
        [
          String(
            setting.setting_value === undefined
              ? ""
              : setting.setting_value
          ),
          setting.setting_key,
        ]
      );
    }

    await connection.commit();

    const [rows] = await connection.query(`
      SELECT
        id,
        setting_key,
        setting_value,
        setting_group,
        description,
        status
      FROM system_settings
      WHERE status = 1
      ORDER BY setting_group, setting_key
    `);

    res.json({
      success: true,
      message: "Settings updated successfully",
      data: rows,
    });
  } catch (error) {
    await connection.rollback();

    console.error("UPDATE SETTINGS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update settings",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};