import Employee from "../models/Employee.js";
import Payroll from "../models/Payroll.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import OfficeHoliday from "../models/OfficeHoliday.js";
import WorkSchedule from "../models/WorkSchedule.js";
import { Parser } from "json2csv";
import puppeteer from "puppeteer";
import PDFDocument from "pdfkit";
import {

  formatDateYYYYMMDD,
  formatTimeIST,
} from "../utils/time.js";
/* ---------------------------------
   Helpers
---------------------------------- */
const normalizeDate = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const getMonthRange = (month) => {
  const [monthName, year] = month.split(" ");
  const monthMap = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3,
    May: 4, Jun: 5, Jul: 6, Aug: 7,
    Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };
  const monthIndex = monthMap[monthName];
  if (monthIndex === undefined) throw new Error("Invalid month format");
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0));
  return { start, end };
};

/* ---------------------------------
   Payroll Calculation
---------------------------------- */
export const calculatePayroll = async (employee, month) => {
  const { start, end } = getMonthRange(month);
  const today = normalizeDate(new Date());
  const effectiveEnd = normalizeDate(end > today ? today : end);

  const attendances = await Attendance.find({
    employeeId: employee._id,
    date: { $gte: start, $lte: effectiveEnd },
  });

  const leaves = await Leave.find({
    employeeId: employee._id,
    status: "approved",
    startDate: { $lte: effectiveEnd },
    endDate: { $gte: start },
  });

  const holidays = await OfficeHoliday.find({
    companyId: employee.companyId,
    startDate: { $lte: effectiveEnd },
    endDate: { $gte: start },
  });

  const schedule = await WorkSchedule.findOne({ employeeId: employee._id });
  const weeklyOffs = Array.isArray(schedule?.weeklyOff) && schedule.weeklyOff.length
    ? schedule.weeklyOff.map(d => String(d).toLowerCase())
    : ["sunday"];

  const attendanceMap = {};
  attendances.forEach(a => {
    attendanceMap[normalizeDate(a.date).toDateString()] = a;
  });

  let present = 0,
    halfDay = 0,
    leaveCount = 0,
    officeHolidays = 0,
    weeklyOff = 0,
    missingDays = 0,
    overtimeHours = 0;

  const daily = [];
  const cursor = new Date(start);

  while (cursor <= effectiveEnd) {
    const dateKey = normalizeDate(cursor).toDateString();
    const dayName = cursor.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    let status = "missing";
    const attendance = attendanceMap[dateKey];

    const isHoliday = holidays.some(h =>
      normalizeDate(h.startDate) <= normalizeDate(cursor) &&
      normalizeDate(h.endDate) >= normalizeDate(cursor)
    );

    const leaveRecord = leaves.find(l =>
      normalizeDate(l.startDate) <= normalizeDate(cursor) &&
      normalizeDate(l.endDate) >= normalizeDate(cursor)
    );

    if (isHoliday) {
      status = "office-holiday";
      officeHolidays++;
    } else if (leaveRecord) {
      status = "leave";
      leaveCount++;
    } else if (weeklyOffs.includes(dayName)) {
      status = "week-off";
      weeklyOff++;
    } else if (attendance) {
      status = attendance.status;
      if (attendance.status === "present") present++;
      else if (attendance.status === "half-day") halfDay += 0.5;
      overtimeHours += attendance.overtimeHours || 0;
    } else {
      missingDays++;
    }

    daily.push({
      date: dateKey,
      day: dayName,
      status,
      checkIn: attendance?.checkIn || null,
      checkOut: attendance?.checkOut || null,
      totalHours: attendance?.totalHours || 0,
      overtimeHours: attendance?.overtimeHours || 0
    });

    cursor.setDate(cursor.getDate() + 1);
  }

 return {
  summary: {
    employeeId: employee._id,
    employeeCode: employee.employeeCode,
    name: employee.name,
    avatar: employee.avatar,
    present,
    halfDay,
    leave: leaveCount,
    officeHolidays,
    weeklyOff,
    missingDays,
    overtimeHours,          // raw decimal for DB
    overtimeHoursHHMM: decimalToHHMM(overtimeHours), // for display / PDF
    totalWorking: present + halfDay + leaveCount
  },
  daily: daily.map(d => ({
    ...d,
    totalHoursHHMM: decimalToHHMM(d.totalHours),
    overtimeHoursHHMM: decimalToHHMM(d.overtimeHours)
  }))
};

};



/* ---------------------------------
   Get All Payrolls
---------------------------------- */


// export const getPayrolls = async (req, res) => {
//   try {
//     const { month } = req.query;
//     if (!month) {
//       return res.status(400).json({ message: "Month required" });
//     }

//     const companyId = req.user.companyId;
//     let employees = [];

//     // 🔐 ROLE BASED EMPLOYEE FETCH
//     if (req.user.role === "employee") {
//       // employee → only self
//       employees = await Employee.find({
//         _id: req.user.employeeId,
//         companyId,
//         status: "active",
//       });
//     } else {
//       // admin / hr → all
//       employees = await Employee.find({
//         companyId,
//         status: "active",
//       });
//     }

//     const payrolls = [];

//     for (const emp of employees) {
//       const { summary, daily } = await calculatePayroll(emp, month);

//       const payroll = await Payroll.findOneAndUpdate(
//         { employeeId: emp._id, month },
//         { ...summary, month, daily, companyId },
//         { upsert: true, new: true }
//       );

//       payrolls.push(payroll);
//     }

//     res.json({ success: true, data: payrolls });
//   } catch (err) {
//     console.error("Payroll fetch error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

export const getPayrolls = async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) {
      return res.status(400).json({ message: "Month required" });
    }

    const companyId = req.user.companyId;
    let employees = [];

    //  ROLE BASED EMPLOYEE FETCH
    if (req.user.role === "employee") {
      const emp = await Employee.findOne({
        employeeId: req.user._id, // login user id
        companyId,
        status: "active",
      });

      if (!emp) {
        return res.json({ success: true, data: [] });
      }

      employees = [emp]; // ARRAY
    } else {
      employees = await Employee.find({
        companyId,
        status: "active",
      });

      if (!employees.length) {
        return res.json({ success: true, data: [] });
      }
    }

    const payrolls = [];

    for (const emp of employees) {
      const { summary, daily } = await calculatePayroll(emp, month);

      const payroll = await Payroll.findOneAndUpdate(
        { employeeId: emp._id, month },
        { ...summary, month, daily, companyId },
        { upsert: true, new: true }
      );

      payrolls.push(payroll);
    }

    res.json({ success: true, data: payrolls });
  } catch (err) {
    console.error("Payroll fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/* ---------------------------------
   Export Payroll CSV
---------------------------------- */
export const exportPayrollCsv = async (req, res) => {
  try {
    const { month, employeeId } = req.query;

    if (!employeeId) {
      return res.status(400).json({ message: "employeeId is required" });
    }

    const payroll = await Payroll.findOne({ month, employeeId });

    if (!payroll) {
      return res.status(404).json({ message: "Payroll data not found for this employee" });
    }

    const rows = [];

    // Ensure payroll.daily exists
    if (Array.isArray(payroll.daily)) {
      payroll.daily.forEach(d => {
        rows.push({
          Employee: payroll.name,
          EmployeeCode: payroll.employeeCode,
          Month: month,
          Date: d.date,
          Day: d.day,
          Status: d.status,
          OvertimeHours: d.overtimeHours || 0,
        });
      });
    }

    // Summary row
    rows.push({
      Employee: payroll.name,
      EmployeeCode: payroll.employeeCode,
      Month: month,
      Date: "SUMMARY",
      Day: "",
      Status: "",
      Present: payroll.present || 0,
      Leave: payroll.leave || 0,
      OfficeHolidays: payroll.officeHolidays || 0,
      WeeklyOff: payroll.weeklyOff || 0,
      MissingDays: payroll.missingDays || 0,
      TotalWorking: payroll.totalWorking || 0,
      OvertimeHours: payroll.overtimeHours || 0,
    });

    const parser = new Parser();
    const csv = parser.parse(rows);

    res.header("Content-Type", "text/csv");
    res.attachment(`Payroll_${payroll.name}_${month}.csv`);
    res.send(csv);

  } catch (err) {
    console.error("CSV export error:", err);
    res.status(500).json({ message: "Server error exporting payroll CSV" });
  }
};







// export const exportPayrollPdf = async (req, res) => {
//   try {
//     const { employeeId, month } = req.query;
//     if (!employeeId || !month) {
//       return res.status(400).json({ message: "employeeId & month required" });
//     }

//     const employee = await Employee.findById(employeeId);
//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }

//     // Get start and end of month
//     const { start, end } = getMonthRange(month);

//     // Fetch data
//     const attendances = await Attendance.find({
//       employeeId,
//       date: { $gte: start, $lte: end },
//     });

//     const leaves = await Leave.find({
//       employeeId,
//       status: "approved",
//       startDate: { $lte: end },
//       endDate: { $gte: start },
//     });

//     const holidays = await OfficeHoliday.find({
//       companyId: employee.companyId,
//       startDate: { $lte: end },
//       endDate: { $gte: start },
//     });

//     const schedule = await WorkSchedule.findOne({ employeeId });
//     const weeklyOffs =
//       schedule?.weeklyOff?.map(d => d.toLowerCase()) || ["sunday"];

//     // Get today's date (ignore future dates)
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     /* ---------- Collect all relevant dates ---------- */
//     const datesSet = new Set();

//     // Attendance dates
//     attendances.forEach(a => datesSet.add(normalizeDate(a.date).toDateString()));

//     // Leave dates
//     leaves.forEach(l => {
//       let current = new Date(l.startDate);
//       const leaveEnd = new Date(l.endDate);
//       while (current <= leaveEnd && current <= today) {
//         datesSet.add(normalizeDate(current).toDateString());
//         current.setDate(current.getDate() + 1);
//       }
//     });

//     // Holiday dates
//     holidays.forEach(h => {
//       let current = new Date(h.startDate);
//       const holidayEnd = new Date(h.endDate);
//       while (current <= holidayEnd && current <= today) {
//         datesSet.add(normalizeDate(current).toDateString());
//         current.setDate(current.getDate() + 1);
//       }
//     });

//     // Weekly offs (from start of month to today)
//     let current = new Date(start);
//     while (current <= today) {
//       const dayName = current.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
//       if (weeklyOffs.includes(dayName)) {
//         datesSet.add(normalizeDate(current).toDateString());
//       }
//       current.setDate(current.getDate() + 1);
//     }

//     // Sort dates ascending
//     const allDates = Array.from(datesSet)
//       .map(d => new Date(d))
//       .sort((a, b) => a - b);

//     /* ---------- Build Rows ---------- */
//     const rows = allDates.map(current => {
//       const key = current.toDateString();
//       const day = current.toLocaleDateString("en-IN", { weekday: "long" });
//       const dayLower = day.toLowerCase();

//       const attendance = attendances.find(a => normalizeDate(a.date).toDateString() === key);
//       const leave = leaves.find(l =>
//         normalizeDate(l.startDate) <= current &&
//         normalizeDate(l.endDate) >= current
//       );
//       const holiday = holidays.find(h =>
//         normalizeDate(h.startDate) <= current &&
//         normalizeDate(h.endDate) >= current
//       );

//       if (attendance) {
//         return {
//           date: formatDateYYYYMMDD(current),
//           day,
//           status: attendance.status,
//           in: formatTimeIST(attendance.checkIn),
//           out: formatTimeIST(attendance.checkOut),
//           hrs: attendance.totalHours || 0,
//           ot: attendance.overtimeHours || 0,
//         };
//       } else if (leave) {
//         return {
//           date: formatDateYYYYMMDD(current),
//           day,
//           status: "leave",
//           in: "-",
//           out: "-",
//           hrs: 0,
//           ot: 0,
//         };
//       } else if (holiday) {
//         return {
//           date: formatDateYYYYMMDD(current),
//           day,
//           status: "office-holiday",
//           in: "-",
//           out: "-",
//           hrs: 0,
//           ot: 0,
//         };
//       } else if (weeklyOffs.includes(dayLower)) {
//         return {
//           date: formatDateYYYYMMDD(current),
//           day,
//           status: "weekly-off",
//           in: "-",
//           out: "-",
//           hrs: 0,
//           ot: 0,
//         };
//       }

//       return null;
//     }).filter(Boolean); // remove nulls just in case

//     /* ---------- PDF ---------- */
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=Payslip_${employee.name}_${month}.pdf`
//     );

//     const doc = new PDFDocument({ margin: 40, size: "A4" });
//     doc.pipe(res);

//     doc.fontSize(18).text("Payslip", { align: "center" });
//     doc.moveDown();
//     doc.fontSize(12).text(`Employee: ${employee.name}`);
//     doc.text(`Employee Code: ${employee.employeeCode}`);
//     doc.text(`Month: ${month}`);
//     doc.moveDown(2);

//     /* ---------- Table Header ---------- */
//     doc.fontSize(11);
//     doc.text("Date", 40);
//     doc.text("Day", 105);
//     doc.text("Status", 170);
//     doc.text("In", 265);
//     doc.text("Out", 325);
//     doc.text("Hrs", 395);
//     doc.text("OT", 435);

//     doc.moveDown();
//     doc.moveTo(40, doc.y).lineTo(520, doc.y).stroke();

//     /* ---------- Rows ---------- */
//     rows.forEach(r => {
//       doc.moveDown(0.7);
//       doc.text(r.date, 40);
//       doc.text(r.day, 105);
//       doc.text(r.status, 170);
//       doc.text(r.in, 265);
//       doc.text(r.out, 325);
//       doc.text(String(r.hrs), 395);
//       doc.text(String(r.ot), 435);
//     });

//     doc.end();

//   } catch (err) {
//     console.error("PDF ERROR:", err);
//     if (!res.headersSent) {
//       res.status(500).json({ message: "PDF generation failed" });
//     }
//   }
// };


// Helper: decimal hours → hh:mm
const decimalToHHMM = (hoursDecimal) => {
  if (!hoursDecimal) return "0:00";
  const h = Math.floor(hoursDecimal);
  const m = Math.round((hoursDecimal - h) * 60);
  return `${h}:${m.toString().padStart(2, "0")}`;
};

export const exportPayrollPdf = async (req, res) => {
  try {
    const { employeeId, month } = req.query;
    if (!employeeId || !month) {
      return res.status(400).json({ message: "employeeId & month required" });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const { start, end } = getMonthRange(month);

    // Fetch data
    const attendances = await Attendance.find({
      employeeId,
      date: { $gte: start, $lte: end },
    });

    const leaves = await Leave.find({
      employeeId,
      status: "approved",
      startDate: { $lte: end },
      endDate: { $gte: start },
    });

    const holidays = await OfficeHoliday.find({
      companyId: employee.companyId,
      startDate: { $lte: end },
      endDate: { $gte: start },
    });

    const schedule = await WorkSchedule.findOne({ employeeId });
    const weeklyOffs = schedule?.weeklyOff?.map(d => d.toLowerCase()) || ["sunday"];

    // Today's date (ignore future)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ---------- Collect all relevant dates ----------
    const datesSet = new Set();

    attendances.forEach(a => datesSet.add(normalizeDate(a.date).toDateString()));

    leaves.forEach(l => {
      let current = new Date(l.startDate);
      const leaveEnd = new Date(l.endDate);
      while (current <= leaveEnd && current <= today) {
        datesSet.add(normalizeDate(current).toDateString());
        current.setDate(current.getDate() + 1);
      }
    });

    holidays.forEach(h => {
      let current = new Date(h.startDate);
      const holidayEnd = new Date(h.endDate);
      while (current <= holidayEnd && current <= today) {
        datesSet.add(normalizeDate(current).toDateString());
        current.setDate(current.getDate() + 1);
      }
    });

    // Weekly offs from start to today
    let current = new Date(start);
    while (current <= today) {
      const dayName = current.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      if (weeklyOffs.includes(dayName)) datesSet.add(normalizeDate(current).toDateString());
      current.setDate(current.getDate() + 1);
    }

    // Sort dates ascending
    const allDates = Array.from(datesSet).map(d => new Date(d)).sort((a, b) => a - b);

    // ---------- Build Rows ----------
    const rows = allDates.map(current => {
      const key = current.toDateString();
      const day = current.toLocaleDateString("en-IN", { weekday: "long" });
      const dayLower = day.toLowerCase();

      const attendance = attendances.find(a => normalizeDate(a.date).toDateString() === key);
      const leave = leaves.find(l => normalizeDate(l.startDate) <= current && normalizeDate(l.endDate) >= current);
      const holiday = holidays.find(h => normalizeDate(h.startDate) <= current && normalizeDate(h.endDate) >= current);

      if (attendance) {
        return {
          date: formatDateYYYYMMDD(current),
          day,
          status: attendance.status,
          in: formatTimeIST(attendance.checkIn),
          out: formatTimeIST(attendance.checkOut),
          hrs: attendance.totalHours || 0,
          ot: attendance.overtimeHours || 0,
        };
      } else if (leave) {
        return {
          date: formatDateYYYYMMDD(current),
          day,
          status: "leave",
          in: "-",
          out: "-",
          hrs: 0,
          ot: 0,
        };
      } else if (holiday) {
        return {
          date: formatDateYYYYMMDD(current),
          day,
          status: "office-holiday",
          in: "-",
          out: "-",
          hrs: 0,
          ot: 0,
        };
      } else if (weeklyOffs.includes(dayLower)) {
        return {
          date: formatDateYYYYMMDD(current),
          day,
          status: "weekly-off",
          in: "-",
          out: "-",
          hrs: 0,
          ot: 0,
        };
      }

      return null;
    }).filter(Boolean);

    // ---------- PDF ----------
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=AttendanceRecord_${employee.name}_${month}.pdf`);

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    doc.fontSize(18).text("Attendance Record", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Employee: ${employee.name}`);
    doc.text(`Employee Code: ${employee.employeeCode}`);
    doc.text(`Month: ${month}`);
    doc.moveDown(2);


    // ---------- Table Header ----------
    const startX = 40;
    const columns = [
      { label: "Date", x: 40, width: 60 },
      { label: "Day", x: 105, width: 60 },
      { label: "Status", x: 170, width: 70 },
      { label: "In", x: 265, width: 50 },
      { label: "Out", x: 325, width: 50 },
      { label: "Hrs", x: 395, width: 40 },
      { label: "OT", x: 435, width: 40 },
    ];

    doc.fontSize(11);

    // Header slightly higher
    const headerY = doc.y - 5; // <-- move header a bit up
    columns.forEach(col => {
      doc.text(col.label, col.x, headerY, {
        width: col.width,
        align: "left",
        baseline: "middle",
      });
    });

    // Border line slightly above rows
    doc.moveTo(startX, headerY + 18).lineTo(520, headerY + 18).stroke();

    // ---------- Rows ----------
    const rowHeight = 20;
    let currentY = headerY + 25; // <-- start rows a bit below header

    rows.forEach(r => {
      columns.forEach(col => {
        let text = "";
        switch (col.label) {
          case "Date": text = r.date; break;
          case "Day": text = r.day; break;
          case "Status": text = r.status; break;
          case "In": text = r.in; break;
          case "Out": text = r.out; break;
          case "Hrs": text = decimalToHHMM(r.hrs); break;
          case "OT": text = decimalToHHMM(r.ot); break;
        }

        doc.text(text, col.x, currentY, {
          width: col.width,
          align: "left",
          baseline: "middle",
        });
      });

      currentY += rowHeight;
    });

    doc.end();



  } catch (err) {
    console.error("PDF ERROR:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "PDF generation failed" });
    }
  }
};
