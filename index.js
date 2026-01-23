import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import employeeRoutes from "./routes/employees.js";
import salaryRoutes from "./routes/salary.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import workScheduleRoutes from "./routes/worksechudel.js"; 
import leaveRoutes from "./routes/leaveRoutes.js";
import officeHolidayRoutes from "./routes/officeHolidayRoutes.js";
import cron from "node-cron";
import { autoCheckoutBySchedule } from "./controllers/attendanceController.js";
import payrollRoutes from "./routes/payroll.js";


dotenv.config();

const app = express();
app.use(express.json());

const allowedOrigins = [
  "http://localhost:5173",
  "https://fronted-face-attendace.vercel.app"
];


app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // Postman ya server-to-server request ke liye
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // cookies ya auth headers allow karne ke liye
}));

app.get("/", (req, res) => {
  res.send("Backend is live and running!");
});

app.use(express.urlencoded({ extended: true }));

// Ping route (UptimeRobot isko call karega)
app.get("/ping", (req, res) => {
  res.send("pong");
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/workschedule", workScheduleRoutes);
app.use("/api", adminRoutes); 
app.use("/api/leaves", leaveRoutes);
app.use("/api/holidays", officeHolidayRoutes);
app.use("/api/payroll", payrollRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection failed:', err));


// Local server (sirf local ke liye)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Run every 15 minutes
cron.schedule("*/15 19-23 * * *", async () => {
  try {
    console.log("Running autoCheckoutBySchedule cron job...");
    await autoCheckoutBySchedule();
  } catch (err) {
    console.error("Error in autoCheckoutBySchedule cron:", err);
  }
});