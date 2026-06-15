import { isDatabaseReady } from "../config/db.js";
import { Customer } from "../models/Customer.js";

export const getCustomers = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const filter = {};
    if (req.user?.role === "employee") {
      filter.employeeId = req.user._id;
    } else if (req.query.employeeId) {
      filter.employeeId = req.query.employeeId;
    }

    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 });

    return res.status(200).json({ data: customers });
  } catch (error) {
    return next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const { customerName, mobile, email, remark, district, state, followUp } = req.body;

    const customer = await Customer.create({
      employeeId: req.user._id || req.user.id,
      employeeName: req.user.name || "Employee",
      customerName,
      mobile,
      email: email || "",
      remark: remark || "",
      district: district || "",
      state: state || "",
      followUp: followUp || "Convert"
    });

    return res.status(201).json({
      message: "Customer created successfully",
      data: customer
    });
  } catch (error) {
    return next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (req.user?.role === "employee" && String(customer.employeeId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { customerName, mobile, email, remark, district, state, followUp } = req.body;
    if (customerName !== undefined) customer.customerName = customerName;
    if (mobile !== undefined) customer.mobile = mobile;
    if (email !== undefined) customer.email = email;
    if (remark !== undefined) customer.remark = remark;
    if (district !== undefined) customer.district = district;
    if (state !== undefined) customer.state = state;
    if (followUp !== undefined) customer.followUp = followUp;

    await customer.save();

    return res.status(200).json({
      message: "Customer updated successfully",
      data: customer
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (req.user?.role === "employee" && String(customer.employeeId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await Customer.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    return next(error);
  }
};
