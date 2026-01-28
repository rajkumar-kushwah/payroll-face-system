import * as faceapi from "face-api.js";
import canvas from "canvas";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import path from "path";
import { fileURLToPath } from "url";

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MODEL_PATH = path.join(__dirname, "../models");

// LOAD MODELS ONCE
await faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_PATH);
await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);

export const faceScanAttendance = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ success: false, message: "Image missing" });

    // Convert base64 image to canvas
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const img = await canvas.loadImage(buffer);

    // Detect face & descriptor
    const detection = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) return res.json({ success: false, message: "Face not detected" });

    const descriptor = detection.descriptor;

    // Fetch all employees with saved descriptors
    const employees = await Employee.find({ faceDescriptor: { $exists: true } });

    // Match employee using Euclidean distance
    let matchedEmployee = null;
    let minDistance = Infinity;

    for (const emp of employees) {
      const empDescriptor = emp.faceDescriptor; // should be an array of 128 numbers
      const distance = faceapi.euclideanDistance(empDescriptor, descriptor);
      if (distance < 0.6 && distance < minDistance) {
        minDistance = distance;
        matchedEmployee = emp;
      }
    }

    if (!matchedEmployee) return res.json({ success: false, message: "Employee not recognized" });

    // Attendance logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      employee: matchedEmployee._id,
      date: today,
    });

    let type = "IN";

    if (!attendance) {
      attendance = await Attendance.create({
        employee: matchedEmployee._id,
        date: today,
        checkIn: new Date(),
      });
    } else if (!attendance.checkOut) {
      attendance.checkOut = new Date();
      await attendance.save();
      type = "OUT";
    } else {
      return res.json({ success: false, message: "Already punched out today" });
    }

    return res.json({
      success: true,
      name: matchedEmployee.name,
      employeeCode: matchedEmployee.employeeCode,
      type,
      time: new Date(),
    });

  } catch (error) {
    console.error("Face scan attendance error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
