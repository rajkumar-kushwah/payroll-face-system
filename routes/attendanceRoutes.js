import express from "express";
import {
  verifyFace,
  punchIn,
  punchOut,
  getTodayAttendance,
  getEmployeeAttendance,
  getAttendanceByRange,
  getAttendanceList,
  filterAttendance,
  getEmployees
} from "../controllers/attendanceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST
router.post("/verify-face", protect, verifyFace);
router.post("/punch-in", protect, punchIn);
router.post("/punch-out", protect, punchOut);

// routes/employeeRoutes.js
router.get("/", protect, getEmployees);

// GET

router.get("/today/:companyId", protect, getTodayAttendance);
router.get("/employee/:employeeId", protect, getEmployeeAttendance);
router.get("/range", protect, getAttendanceByRange);
router.get("/list", protect, getAttendanceList);
router.get("/filter", protect, filterAttendance);

export default router;
