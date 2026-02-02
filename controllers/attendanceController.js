import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import { verifyEmployeeFace } from "../utils/faceMatch.js";
import { reverseGeocode } from "../utils/location.js";

/* ================= OFFICE RULES ================= */
const OFFICE_IN_HOUR = 9;
const OFFICE_IN_MIN = 30;
const FULL_DAY_MINUTES = 480;
const HALF_DAY_MINUTES = 240;

/* ================= HELPERS ================= */
function getDateString(d = new Date()) {
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

/* ================= VERIFY FACE ================= */
export const verifyFace = async (req, res) => {
  try {
    const { companyId, image } = req.body;

    if (!companyId || !image) {
      return res.status(400).json({ message: "Invalid face data" });
    }

    const base64 = image.startsWith("data:image")
      ? image.split(",")[1]
      : image;

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
    const today = getDateString();

    const attendance = await Attendance.findOne({
      companyId,
      employeeId: emp._id,
      date: today
    });

    let attendanceStatus = "NOT_PUNCHED";
    if (attendance) {
      if (attendance.inTime && !attendance.outTime) attendanceStatus = "IN";
      else if (attendance.inTime && attendance.outTime) attendanceStatus = "OUT";
    }

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

/* ================= PUNCH IN ================= */
export const punchIn = async (req, res) => {
  try {
    const { companyId, employeeId, latitude, longitude  } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const today = getDateString();
    const now = new Date();

    const officeIn = new Date();
    officeIn.setHours(OFFICE_IN_HOUR, OFFICE_IN_MIN, 0, 0);

    let lateMinutes = 0;
    if (now > officeIn) {
      lateMinutes = Math.floor((now - officeIn) / 60000);
    }

    const address = await reverseGeocode(latitude, longitude);

    const attendance = await Attendance.create({
      companyId,
      employeeId,
      employeeCode: employee.employeeCode,
      employeeName: employee.name,
      faceImage: employee.faceImage,
      date: today,                 //  STRING
      inTime: now,
      inLocation:{
        address,
        latitude,
        longitude
      },
      lateMinutes,
      status: "PRESENT"
    });

    res.json({
      message: "Punch IN successful",
      inTime: attendance.inTime,
      lateMinutes
    });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Already punched IN today" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= PUNCH OUT ================= */
export const punchOut = async (req, res) => {
  try {
    const { companyId, employeeId,latitude, longitude } = req.body;

    const today = getDateString();
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

    const workingMinutes = Math.floor(
      (now - attendance.inTime) / 60000
    );

    let status = "ABSENT";
    if (workingMinutes >= FULL_DAY_MINUTES) status = "PRESENT";
    else if (workingMinutes >= HALF_DAY_MINUTES) status = "HALF";

    const address = await reverseGeocode(latitude, longitude);

    attendance.outTime = now;
    attendance.outLocation = {
      address,
      latitude,
      longitude
    };
    attendance.workingMinutes = workingMinutes;
    attendance.status = status;

    await attendance.save();

    res.json({
      message: "Punch OUT successful",
      outTime: attendance.outTime,
      workingMinutes,
      status
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= EMPLOYEE ATTENDANCE ================= */
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

/* ================= TODAY ATTENDANCE ================= */
export const getTodayAttendance = async (req, res) => {
  try {
    const { companyId } = req.params;

    const today = getDateString();

    const attendance = await Attendance.find({
      companyId,
      date: today
    }).sort({ inTime: 1 });

    res.json(attendance);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= FILTER ATTENDANCE ================= */
export const filterAttendance = async (req, res) => {
  try {
    const {
      companyId,
      date,
      fromDate,
      toDate,
      employeeId,
      status
    } = req.query;

    if (!companyId) {
      return res.status(400).json({ message: "companyId required" });
    }

    let filter = { companyId };

    // ✅ Single date filter (full day)
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      filter.date = { $gte: start, $lte: end };
    }

    // ✅ Date range filter (full days)
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);

      filter.date = { $gte: start, $lte: end };
    }

    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;

    const data = await Attendance
      .find(filter)
      .populate("employeeId", "name code") // optional
      .sort({ date: -1, inTime: 1 });

    res.json({
      success: true,
      count: data.length,
      data
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


/* ================= PAGINATED LIST ================= */
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

export const getAttendanceByRange = async (req, res) => {
  try {
    const {
      companyId,
      from,
      to,
      employeeId,
      status
    } = req.query;

    if (!companyId || !from || !to) {
      return res.status(400).json({
        message: "companyId, from and to are required"
      });
    }

    let filter = {
      companyId,
      date: { $gte: from, $lte: to } //  STRING RANGE
    };

    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;

    const records = await Attendance.find(filter)
      .sort({ date: 1, inTime: 1 });

    res.json({
      success: true,
      count: records.length,
      data: records
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) {
      return res.status(400).json({ message: "companyId required" });
    }

    const employees = await Employee.find({ companyId, status: "active" })
      .select("name employeeCode phone"); // sirf required fields

    res.json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};