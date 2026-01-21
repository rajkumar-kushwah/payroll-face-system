// employeeController.js

import Employee from "../models/Employee.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Leave from "../models/Leave.js";
import Attendance from "../models/Attendance.js";
import Payroll from "../models/Payroll.js";
import Company from "../models/Company.js";
import WorkSchedule from "../models/WorkSchedule.js";

// -------------------------------------------------------------------
// GET ALL EMPLOYEES
// -------------------------------------------------------------------
export const getEmployees = async (req, res) => {
  try {
    let employees = [];

    if (req.user.role === "employee") {
      // Sirf apna record → employeeId se
      const emp = await Employee.findOne({ employeeId: req.user._id });
      if (!emp) return res.status(404).json({ message: "Employee not found" });

      const leaveData = await Leave.find({ employeeId: emp._id });
      const attendanceData = await Attendance.find({ employeeId: emp._id });
      const salaryData = await Payroll.find({ employeeId: emp._id });

      employees = [
        {
          ...emp._doc,
          leaveData,
          attendanceData,
          salaryData,
        },
      ];
    } else if (["hr", "owner", "admin"].includes(req.user.role)) {
      // HR / Owner → company ke sab employees
      const allEmployees = await Employee.find({ companyId: req.user.companyId }).sort({ createdAt: -1 });

      employees = await Promise.all(
        allEmployees.map(async (emp) => {
          const leaveData = await Leave.find({ employeeId: emp._id });
          const attendanceData = await Attendance.find({ employeeId: emp._id });
          const salaryData = await Payroll.find({ employeeId: emp._id });

          return {
            ...emp._doc,
            leaveData,
            attendanceData,
            salaryData,
          };
        })
      );
    } else {
      return res.status(403).json({ message: "Unauthorized role" });
    }

    res.json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (err) {
    console.error("Get Employees Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};




// -------------------------------------------------------------------
// GET SINGLE EMPLOYEE
// -------------------------------------------------------------------
export const getEmployeeById = async (req, res) => {
  try {
    const emp = await Employee.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!emp) return res.status(404).json({ message: "Employee not found" });

    res.json({ success: true, emp });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// -------------------------------------------------------------------
// ADD EMPLOYEE
// -------------------------------------------------------------------
export const addEmployee = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      name,
      email,
      password,
      phone,
      department,
      designation,
      jobRole,
      basicSalary,
      dob,
      notes,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    // Check duplicate email
    const existsUser = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
    if (existsUser) return res.status(400).json({ message: "User with this email already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);

    // 1️⃣ Create User
    const user = await User.create([{
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "employee",
      companyId: req.user.companyId,
      avatar: req.file ? req.file.path : "",
      emailVerified: true,
      phone: phone || "",
      bio: "",
      gender: "other",
      dateOfBirth: dob ? new Date(dob) : null,
      companyName: req.body.companyName || "",
    }], { session });

    // 2️⃣ Create Employee with reference to User
    const employee = await Employee.create([{
      companyId: req.user.companyId,
      employeeId: user[0]._id, // Reference to User
      createdBy: req.user._id,
      name,
      email: email.toLowerCase(),
      phone,
      department,
      designation,
      jobRole,
      basicSalary: Number(basicSalary) || 0,
      dateOfBirth: dob ? new Date(dob) : undefined,
      avatar: req.file ? req.file.path : "",
      notes,
      isAdmin: false,
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Employee registered successfully",
      employee,
      userLoginData: { email: user[0].email, password }
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Add Employee Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// -------------------------------------------------------------------
// UPDATE EMPLOYEE
// -------------------------------------------------------------------
// export const updateEmployeeProfile = async (req, res) => {
//   try {
//     const updateData = {};

//     Object.keys(req.body).forEach((key) => {
//       if (req.body[key] !== undefined) updateData[key] = req.body[key];
//     });

//     if (req.file?.path) updateData.avatar = req.file.path;
//     if (updateData.joinDate) updateData.joinDate = new Date(updateData.joinDate);
//     if (updateData.dob) updateData.dateOfBirth = new Date(updateData.dob);

//     const emp = await Employee.findOneAndUpdate(
//       { _id: req.params.id, companyId: req.user.companyId },
//       updateData,
//       { new: true }
//     );

//     if (!emp) return res.status(404).json({ message: "Employee not found" });

//     res.json({ success: true, message: "Updated successfully", emp });
//   } catch (err) {
//     console.error("Update Error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

export const updateEmployeeProfile = async (req, res) => {
  try {
    const updateData = {};

    // Body ke fields ko check kar ke add karo
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    });

    // Avatar file check
    if (req.file?.path) updateData.avatar = req.file.path;

    // Dates ko convert karo
    if (updateData.joinDate) updateData.joinDate = new Date(updateData.joinDate);
    if (updateData.dob) updateData.dateOfBirth = new Date(updateData.dob);

    // Employee update
    const emp = await Employee.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      updateData,
      { new: true }
    );

    if (!emp) return res.status(404).json({ message: "Employee not found" });

    // 🔹 User collection update (agar employeeId reference hai)
    const userUpdateData = {};
    if (updateData.name) userUpdateData.name = updateData.name;
    if (updateData.phone) userUpdateData.phone = updateData.phone;
    if (updateData.avatar) userUpdateData.avatar = updateData.avatar;
    if (updateData.bio) userUpdateData.bio = updateData.bio;
    if (updateData.gender) userUpdateData.gender = updateData.gender;
    if (updateData.dateOfBirth) userUpdateData.dateOfBirth = updateData.dateOfBirth;
    if (updateData.companyName) userUpdateData.companyName = updateData.companyName;

    if (emp.employeeId) {
      await User.findByIdAndUpdate(emp.employeeId, userUpdateData, { new: true });
    }

    res.json({ success: true, message: "Updated successfully", emp });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


export const deleteEmployee = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1️ Employee ko delete karo
    const emp = await Employee.findOneAndDelete(
      { _id: req.params.id, companyId: req.user.companyId },
      { session }
    );

    if (!emp) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Employee not found" });
    }

    // 2️ Related User ko delete karo
    await User.findOneAndDelete({ _id: emp.employeeId }, { session });

    // Optional: related data bhi delete kar sakte ho
    await Leave.deleteMany({ employeeId: emp._id }, { session });
    await Attendance.deleteMany({ employeeId: emp._id }, { session });
    await Payroll.deleteMany({ employeeId: emp._id }, { session });
    await WorkSchedule.deleteMany({ employeeId: emp._id }, { session });

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, message: "Employee and related user deleted successfully" });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Delete Employee Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// -------------------------------------------------------------------
// SEARCH EMPLOYEES
// -------------------------------------------------------------------
export const searchEmployees = async (req, res) => {
  try {
    const { search } = req.query;
    const query = { companyId: req.user.companyId };

    if (search) {
      const regex = { $regex: search, $options: "i" };
      query.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { department: regex },
        { jobRole: regex },
        { employeeCode: regex },
        { status: regex },
      ];

      if (mongoose.isValidObjectId(search)) {
        query.$or.push({ _id: new mongoose.Types.ObjectId(search) });
      }
    }

    const employees = await Employee.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// -------------------------------------------------------------------
// FILTER EMPLOYEES
// -------------------------------------------------------------------
export const filterEmployees = async (req, res) => {
  try {
    const { jobRole, department, minSalary, maxSalary, sort } = req.query;
    const query = { companyId: req.user.companyId };

    if (jobRole) query.jobRole = jobRole;
    if (department) query.department = department;

    if (minSalary || maxSalary) {
      query.basicSalary = {};
      if (minSalary) query.basicSalary.$gte = Number(minSalary);
      if (maxSalary) query.basicSalary.$lte = Number(maxSalary);
    }

    let employees = await Employee.find(query);

    if (sort === "a-z") employees.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "salary-high")
      employees.sort((a, b) => b.basicSalary - a.basicSalary);
    else if (sort === "latest")
      employees.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
