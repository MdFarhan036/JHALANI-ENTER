const express = require("express");

const {
  getSettings,
  getSettingsByGroup,
  getSetting,
  updateSetting,
  updateSettings,
} = require("../controllers/systemSettingsController");

const router = express.Router();

/* All settings */
router.get("/", getSettings);

/* Settings by group */
router.get("/group/:group", getSettingsByGroup);

/* Update multiple settings */
router.put("/", updateSettings);

/* Single setting */
router.get("/:key", getSetting);

/* Update single setting */
router.put("/:key", updateSetting);

module.exports = router;