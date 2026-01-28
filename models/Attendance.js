import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },

  //  DATE
  date: {
    type: Date,
    required: true
  },

  //  QUICK DISPLAY (table fast load)
  employeeName: String,

  //  FACE SNAP
  faceImage: String, // image URL / base64 / cloudinary url

  //  IN DATA
  checkIn: {
    time: Date,
    address: String
  },

  //  OUT DATA
  checkOut: {
    time: Date,
    address: String
  },
  
  //  CALCULATED
  workedMinutes: Number,

  attendanceType: {
    type: String,
    enum: ["EARLY", "ON_TIME", "LATE"],
  },

  status: {
    type: String,
    enum: ["H", "A", "L"],
    default: "H"
  }

}, { timestamps: true });


//  UNIQUE INDEX (ek employee ek date par ek hi attendance)
attendanceSchema.index(
  { employee: 1, date: 1 },
  { unique: true }
);



export default mongoose.model("Attendance", attendanceSchema);
