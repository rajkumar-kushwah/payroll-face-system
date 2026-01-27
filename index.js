import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.js';
import employeeRoutes from "./routes/employees.js";
import salaryRoutes from "./routes/salary.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import workScheduleRoutes from "./routes/worksechudel.js"; 
import leaveRoutes from "./routes/leaveRoutes.js";
import officeHolidayRoutes from "./routes/officeHolidayRoutes.js";
import payrollRoutes from "./routes/payroll.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// ---------- Socket.IO ----------
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://fronted-face-attendace.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ---------- Middleware ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "http://localhost:5173",
  "https://fronted-face-attendace.vercel.app"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (!allowedOrigins.includes(origin)) {
      return callback(new Error("CORS not allowed"), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// ---------- Routes ----------
app.get("/", (req, res) => res.send("Backend is live and running!"));
app.get("/ping", (req, res) => res.send("pong"));

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/workschedule", workScheduleRoutes);
app.use("/api", adminRoutes); 
app.use("/api/leaves", leaveRoutes);
app.use("/api/holidays", officeHolidayRoutes);
app.use("/api/payroll", payrollRoutes);

// ---------- MongoDB ----------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection failed:', err));

// ---------- Socket Events ----------
io.on("connection", (socket) => {
  console.log(" Socket connected:", socket.id);

  socket.on("markAttendance", (data) => {
    console.log("Attendance received:", data);
    socket.emit("attendanceMarked", { success: true, employee: data.name });
  });

  socket.on("disconnect", () => {
    console.log(" Socket disconnected:", socket.id);
  });
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(` Server + Socket.IO running on port ${PORT}`);
});

export { io };
