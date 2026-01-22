import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: { type: String, unique: true },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    // Optional: future login system
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    //  FACE PREVIEW IMAGE
    faceImage: {
      type: String,
      default: "",
    },

    //  CORE FACE DATA
    faceDescriptor: {
      type: [Number], // 128 values
      required: true,
    },

    name: { type: String, required: true },

    // Registration ke liye rakh sakte ho
    email: {
      type: String,
      lowercase: true,
      required: true,
    },

    phone: { type: String, default: "" },

    isAdmin: {
      type: Boolean,
      default: false,
    },

    dateOfBirth: Date,
    jobRole: String,
    department: String,
    designation: String,

    joinDate: { type: Date, default: Date.now },

    status: {
      type: String,
      enum: ["active", "inactive", "terminated"],
      default: "active",
    },

    notes: String,
    basicSalary: { type: Number, default: 0 },
  },
  { timestamps: true }
);

//  Auto Employee Code
employeeSchema.pre("save", async function (next) {
  if (!this.employeeCode) {
    const lastEmp = await mongoose
      .model("Employee")
      .findOne({ companyId: this.companyId })
      .sort({ createdAt: -1 });

    let nextNumber = 1;
    if (lastEmp?.employeeCode) {
      nextNumber = parseInt(lastEmp.employeeCode.split("-")[1]) + 1;
    }

    this.employeeCode = `EMP-${String(nextNumber).padStart(3, "0")}`;
  }
  next();
});

export default mongoose.model("Employee", employeeSchema);
