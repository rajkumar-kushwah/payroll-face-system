import express from "express";
import { faceScanAttendance } from "../controllers/attendanceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/face-scan", protect, faceScanAttendance);

export default router;
