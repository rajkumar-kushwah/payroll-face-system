import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import { verifyEmployeeFace } from "../utils/faceMatch.js";

/* OFFICE RULES */
const OFFICE_IN_HOUR = 9;
const OFFICE_IN_MIN = 30;
const FULL_DAY_MINUTES = 480;
const HALF_DAY_MINUTES = 240;

/* helper */
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/*  VERIFY FACE ONLY */
// export const verifyFace = async (req, res) => {
//   try {
//     const { companyId, image } = req.body;

//     if (!companyId || !image) {
//       return res.status(400).json({ message: "Invalid face data" });
//     }

//     // base64 prefix hatao
//     const base64 = image.startsWith("data:image")
//       ? image.split(",")[1]
//       : image;

//     const employees = await Employee.find({
//       companyId,
//       status: "active",
//       faceDescriptor: { $exists: true }
//     });

//     const result = await verifyEmployeeFace(employees, base64); 
//     // 👆 yahan image pass hogi

//     if (!result) {
//       return res.status(401).json({ message: "Face not matched" });
//     }

//     const emp = result.employee;

//     res.json({
//       verified: true,
//       employee: {
//         id: emp._id,
//         name: emp.name,
//         code: emp.employeeCode,
//         faceImage: emp.faceImage
//       },
//       confidence: result.confidence
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };


export const verifyFace = async (req, res) => {
  try {
    const { companyId, image } = req.body;

    if (!companyId || !image) {
      return res.status(400).json({ message: "Invalid face data" });
    }

    // base64 prefix hatao
    const base64 = image.startsWith("data:image")
      ? image.split(",")[1]
      : image;

    //  Active employees with faceDescriptor
    const employees = await Employee.find({
      companyId,
      status: "active",
      faceDescriptor: { $exists: true }
    });

    const result = await verifyEmployeeFace(employees, base64);

    if (!result) {
      return res.status(401).json({ message: "Face not matched" });
    }

    const emp = result.employee;

    //  Check today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId: emp._id,
      companyId,
      date: today
    });

    let attendanceStatus = "NOT_PUNCHED"; // default
    if (attendance) {
      if (attendance.inTime && !attendance.outTime) attendanceStatus = "IN";      // Punch IN done
      else if (attendance.inTime && attendance.outTime) attendanceStatus = "OUT"; // Punch OUT done
    }

    //  Send response with attendance status
    res.json({
      verified: true,
      employee: {
        id: emp._id,
        name: emp.name,
        code: emp.employeeCode,
        faceImage: emp.faceImage
      },
      confidence: result.confidence,
      attendanceStatus
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/*  PUNCH IN */
export const punchIn = async (req, res) => {
  try {
    const { companyId, employeeId, location } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const today = startOfToday();
    const now = new Date();

    const officeIn = new Date();
    officeIn.setHours(OFFICE_IN_HOUR, OFFICE_IN_MIN, 0, 0);

    let lateMinutes = 0;
    if (now > officeIn) {
      lateMinutes = Math.floor((now - officeIn) / 60000);
    }

    const attendance = await Attendance.create({
      companyId,
      employeeId,
      employeeCode: employee.employeeCode,
      employeeName: employee.name,
      faceImage: employee.faceImage,
      date: today,
      inTime: now,
      inLocation: location,
      lateMinutes,
      status: "PRESENT"
    });

    res.json({
      message: "Punch IN successful",
      inTime: now,
      lateMinutes
    });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Already punched IN today" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

/*  PUNCH OUT */
export const punchOut = async (req, res) => {
  try {
    const { companyId, employeeId, location } = req.body;

    const today = startOfToday();
    const now = new Date();

    const attendance = await Attendance.findOne({
      companyId,
      employeeId,
      date: today
    });

    if (!attendance || !attendance.inTime) {
      return res.status(400).json({ message: "Punch IN not found" });
    }

    if (attendance.outTime) {
      return res.status(409).json({ message: "Already punched OUT" });
    }

    const workingMinutes =
      Math.floor((now - attendance.inTime) / 60000);

    let status = "ABSENT";
    if (workingMinutes >= FULL_DAY_MINUTES) status = "PRESENT";
    else if (workingMinutes >= HALF_DAY_MINUTES) status = "HALF";

    attendance.outTime = now;
    attendance.outLocation = location;
    attendance.workingMinutes = workingMinutes;
    attendance.status = status;

    await attendance.save();

    res.json({
      message: "Punch OUT successful",
      outTime: now,
      workingMinutes,
      status
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getEmployeeAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const records = await Attendance.find({ employeeId })
      .sort({ date: -1 });

    res.json(records);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getAttendanceByRange = async (req, res) => {
  try {
    const { companyId, from, to } = req.query;

    const records = await Attendance.find({
      companyId,
      date: {
        $gte: new Date(from),
        $lte: new Date(to)
      }
    }).sort({ date: 1 });

    res.json(records);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getAttendanceList = async (req, res) => {
  try {
    const { companyId, page = 1, limit = 20 } = req.query;

    const data = await Attendance.find({ companyId })
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Attendance.countDocuments({ companyId });

    res.json({
      total,
      page: Number(page),
      data
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getTodayAttendance = async (req, res) => {
  try {
    const { companyId } = req.params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.find({
      companyId,
      date: today
    }).sort({ inTime: 1 });

    res.json(attendance);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
