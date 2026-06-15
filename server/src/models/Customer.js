import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    employeeName: { type: String, required: true },
    customerName: { type: String, required: true, trim: true, match: /^[a-zA-Z\s]+$/ },
    mobile: { type: String, required: true, trim: true, match: /^\d{10}$/ },
    email: { type: String, trim: true, default: "" },
    remark: { type: String, trim: true, default: "" },
    district: { type: String, trim: true, default: "", match: /^[a-zA-Z\s]*$/ },
    state: { type: String, trim: true, default: "", match: /^[a-zA-Z\s]*$/ },
    followUp: { type: String, enum: ["Convert", "Converted"], default: "Convert" }
  },
  { timestamps: true }
);

customerSchema.index({ employeeId: 1, createdAt: -1 });

export const Customer = mongoose.model("Customer", customerSchema);
