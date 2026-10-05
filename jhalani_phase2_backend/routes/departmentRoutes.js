const express = require("express");

const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticate, getDepartments);

router.post("/", authenticate, createDepartment);

router.put("/:id", authenticate, updateDepartment);

router.delete("/:id", authenticate, deleteDepartment);

module.exports = router;