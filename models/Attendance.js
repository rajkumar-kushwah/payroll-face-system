import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },

  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },

  employeeCode: {
    type: String,
    required: true
  },

  employeeName: String,

  faceImage: String, // register wali image

  date: {
    type: Date,
    required: true
  },

  inTime: Date,
  outTime: Date,

  inLocation: String,
  outLocation: String,

  workingMinutes: {
    type: Number,
    default: 0
  },

  lateMinutes: {
    type: Number,
    default: 0
  },

  earlyMinutes: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ["PRESENT", "HALF", "ABSENT"],
    default: "PRESENT"
  }

}, { timestamps: true });

attendanceSchema.index(
  { employeeId: 1, companyId: 1, date: 1 },
  { unique: true }
);

export default mongoose.model("Attendance", attendanceSchema);
