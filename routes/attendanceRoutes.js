import express from "express";
import { faceScanAttendance } from "../controllers/attendanceController.js";

const router = express.Router();

router.post("/face-scan", faceScanAttendance);

export default router;
