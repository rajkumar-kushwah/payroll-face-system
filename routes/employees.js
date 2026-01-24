import express from "express";
import {
  searchEmployees,
  getEmployees,
  addEmployee,
  deleteEmployee,
  getEmployeeById,
  updateEmployeeProfile,
} from "../controllers/employeeController.js";
import { adminProtect, protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.use(protect);

// FIXED ROUTES FIRST
router.get("/search", searchEmployees);

// AVATAR ROUTES – before :id
router.put("/profile/:id", upload.single("avatar"), updateEmployeeProfile);

// NORMAL EMPLOYEE ROUTES
router.get("/", getEmployees);
router.post("/", adminProtect, upload.single("faceImage"), addEmployee);

// DYNAMIC ROUTES LAST
router.get("/:id", getEmployeeById);
router.delete("/:id",adminProtect, deleteEmployee);

export default router;
