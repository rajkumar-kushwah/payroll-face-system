// employeeController.js

import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// -------------------------------------------------------------------
// GET ALL EMPLOYEES
// -------------------------------------------------------------------
export const getEmployees = async (req, res) => {
  try {
    let employees = [];

    if (req.user.role === "employee") {
      // Employee can see only their own record
      const emp = await Employee.findOne({ employeeId: req.user._id });
      if (!emp) return res.status(404).json({ message: "Employee not found" });

      employees = [emp];
    } else if (["hr", "owner", "admin"].includes(req.user.role)) {
      // HR / Owner → all company employees
      employees = await Employee.find({ companyId: req.user.companyId }).sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ message: "Unauthorized role" });
    }

    res.json({ success: true, count: employees.length, employees });
  } catch (err) {
    console.error("Get Employees Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// -------------------------------------------------------------------
// GET SINGLE EMPLOYEE BY ID
// -------------------------------------------------------------------
export const getEmployeeById = async (req, res) => {
  try {
    const emp = await Employee.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!emp) return res.status(404).json({ message: "Employee not found" });

    res.json({ success: true, employee: emp });
  } catch (err) {
    console.error("Get Employee Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// -------------------------------------------------------------------
// ADD EMPLOYEE (face scan data included)
// -------------------------------------------------------------------
export const addEmployee = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      name,
      email,
      phone,
      jobRole,
      department,
      designation,
      basicSalary,
      dateOfBirth,
      notes,
      faceDescriptor, // array of 128 floats
    } = req.body;

    if (!name || !email || !faceDescriptor)
      return res.status(400).json({ message: "Name, email, and faceDescriptor are required." });

    // Check duplicate email
    const existsUser = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
    if (existsUser) return res.status(400).json({ message: "User with this email already exists." });

    // Create User (optional password for login later)
    const hashedPassword = await bcrypt.hash("default123", 10);

    const user = await User.create(
      [
        {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: "employee",
          companyId: req.user.companyId,
          avatar: req.file?.path || "", // face image
          phone: phone || "",
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        },
      ],
      { session }
    );

    // Create Employee with face data
    const employee = await Employee.create(
      [
        {
          companyId: req.user.companyId,
          employeeId: user[0]._id,
          createdBy: req.user._id,
          name,
          email: email.toLowerCase(),
          phone,
          jobRole,
          department,
          designation,
          basicSalary: Number(basicSalary) || 0,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          notes,
          faceImage: req.file?.path || "",
          faceDescriptor,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Employee added successfully",
      employee,
      userLoginData: { email: user[0].email, password: "default123" },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Add Employee Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// -------------------------------------------------------------------
// UPDATE EMPLOYEE (can update face data)
// -------------------------------------------------------------------
export const updateEmployeeProfile = async (req, res) => {
  try {
    const updateData = {};

    // Copy all fields from body
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    });

    // Update face image if file uploaded
    if (req.file?.path) updateData.faceImage = req.file.path;

    // Update employee
    const emp = await Employee.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      updateData,
      { new: true }
    );

    if (!emp) return res.status(404).json({ message: "Employee not found" });

    // Sync with User collection if needed
    const userUpdate = {};
    if (updateData.name) userUpdate.name = updateData.name;
    if (updateData.phone) userUpdate.phone = updateData.phone;
    if (updateData.faceImage) userUpdate.avatar = updateData.faceImage;

    if (emp.employeeId) await User.findByIdAndUpdate(emp.employeeId, userUpdate, { new: true });

    res.json({ success: true, message: "Employee updated successfully", employee: emp });
  } catch (err) {
    console.error("Update Employee Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// -------------------------------------------------------------------
// DELETE EMPLOYEE
// -------------------------------------------------------------------
export const deleteEmployee = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const emp = await Employee.findOneAndDelete(
      { _id: req.params.id, companyId: req.user.companyId },
      { session }
    );

    if (!emp) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Employee not found" });
    }

    // Delete corresponding user
    if (emp.employeeId) await User.findByIdAndDelete(emp.employeeId, { session });

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, message: "Employee deleted successfully" });
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
// export const searchEmployees = async (req, res) => {
//   try {
//     const { search } = req.query;
//     const query = { companyId: req.user.companyId };

//     if (search) {
//       const regex = { $regex: search, $options: "i" };
//       query.$or = [
//         { name: regex },
//         { email: regex },
//         { phone: regex },
//         { department: regex },
//         { jobRole: regex },
//         { employeeCode: regex },
//         { status: regex },
//       ];

//       if (mongoose.isValidObjectId(search)) {
//         query.$or.push({ _id: new mongoose.Types.ObjectId(search) });
//       }
//     }

//     const employees = await Employee.find(query).sort({ createdAt: -1 });

//     res.json({
//       success: true,
//       count: employees.length,
//       employees,
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

// // -------------------------------------------------------------------
// // FILTER EMPLOYEES
// // -------------------------------------------------------------------
// export const filterEmployees = async (req, res) => {
//   try {
//     const { jobRole, department, minSalary, maxSalary, sort } = req.query;
//     const query = { companyId: req.user.companyId };

//     if (jobRole) query.jobRole = jobRole;
//     if (department) query.department = department;

//     if (minSalary || maxSalary) {
//       query.basicSalary = {};
//       if (minSalary) query.basicSalary.$gte = Number(minSalary);
//       if (maxSalary) query.basicSalary.$lte = Number(maxSalary);
//     }

//     let employees = await Employee.find(query);

//     if (sort === "a-z") employees.sort((a, b) => a.name.localeCompare(b.name));
//     else if (sort === "salary-high")
//       employees.sort((a, b) => b.basicSalary - a.basicSalary);
//     else if (sort === "latest")
//       employees.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//     res.json({
//       success: true,
//       count: employees.length,
//       employees,
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

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

      // Agar ObjectId bhi search me match ho
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
    console.error("Search Employees Error:", err);
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

    // Sorting
    if (sort === "a-z") employees.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "salary-high")
      employees.sort((a, b) => b.basicSalary - a.basicSalary);
    else if (sort === "salary-low")
      employees.sort((a, b) => a.basicSalary - b.basicSalary);
    else if (sort === "latest")
      employees.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (err) {
    console.error("Filter Employees Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
