import { Order } from "../models/Order.js";
import { ReturnRequest } from "../models/ReturnRequest.js";
import { CallingRecord } from "../models/CallingRecord.js";

const startOfDay = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

const getEmployeeId = (req) => req.user?._id || req.user?.id;
const getEmployeeName = (req) => req.user?.name || "Employee";

export const getEmployeeDashboard = async (req, res, next) => {
  try {
    const employeeId = getEmployeeId(req);
    if (!employeeId) {
      return res.status(401).json({ message: "Employee context not found" });
    }

    const todayStart = startOfDay();
    const todayEnd = endOfDay();

    const [ordersToday, returnsToday] = await Promise.all([
      Order.countDocuments({
        employeeId,
        createdAt: { $gte: todayStart, $lte: todayEnd }
      }),
      ReturnRequest.countDocuments({
        employeeId,
        createdAt: { $gte: todayStart, $lte: todayEnd }
      })
    ]);

    return res.status(200).json({
      data: {
        name: getEmployeeName(req),
        ordersToday,
        returnsToday
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const getEmployeeOrdersHistory = async (req, res, next) => {
  try {
    const employeeId = getEmployeeId(req);
    if (!employeeId) {
      return res.status(401).json({ message: "Employee context not found" });
    }
    const orders = await Order.find({ employeeId }).sort({ createdAt: -1 });
    return res.status(200).json({ data: orders });
  } catch (error) {
    return next(error);
  }
};

export const getEmployeeReturnsHistory = async (req, res, next) => {
  try {
    const employeeId = getEmployeeId(req);
    if (!employeeId) {
      return res.status(401).json({ message: "Employee context not found" });
    }
    const requests = await ReturnRequest.find({ employeeId }).sort({ createdAt: -1 });
    return res.status(200).json({ data: requests });
  } catch (error) {
    return next(error);
  }
};

export const getEmployeeCallingRecords = async (req, res, next) => {
  try {
    const employeeId = getEmployeeId(req);
    if (!employeeId) {
      return res.status(401).json({ message: "Employee context not found" });
    }

    const { startDate, endDate } = req.query;
    const filter = { employeeId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        filter.date.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        filter.date.$lte = e;
      }
    }

    const records = await CallingRecord.find(filter).sort({ date: -1, createdAt: -1 });
    return res.status(200).json({ data: records });
  } catch (error) {
    return next(error);
  }
};

export const createEmployeeCallingRecord = async (req, res, next) => {
  try {
    const employeeId = getEmployeeId(req);
    const employeeName = getEmployeeName(req);
    if (!employeeId) {
      return res.status(401).json({ message: "Employee context not found" });
    }

    const {
      date, outgoingCalls, incomingCalls, connectedCalls,
      notConnectedCalls, interestedLeads, notInterestedLeads,
      followUpCalls, followUpLeads, conversionsDone, revenueGenerated
    } = req.body;

    const record = await CallingRecord.create({
      employeeId,
      employeeName,
      date: date || new Date(),
      outgoingCalls: outgoingCalls || 0,
      incomingCalls: incomingCalls || 0,
      connectedCalls: connectedCalls || 0,
      notConnectedCalls: notConnectedCalls || 0,
      interestedLeads: interestedLeads || 0,
      notInterestedLeads: notInterestedLeads || 0,
      followUpCalls: followUpCalls || 0,
      followUpLeads: followUpLeads || 0,
      conversionsDone: conversionsDone || 0,
      revenueGenerated: revenueGenerated || 0,
      createdBy: employeeId
    });

    return res.status(201).json({
      message: "Calling record created successfully",
      data: record
    });
  } catch (error) {
    return next(error);
  }
};

export const updateEmployeeCallingRecord = async (req, res, next) => {
  try {
    const employeeId = getEmployeeId(req);
    if (!employeeId) {
      return res.status(401).json({ message: "Employee context not found" });
    }

    const record = await CallingRecord.findOne({ _id: req.params.id, employeeId });
    if (!record) {
      return res.status(404).json({ message: "Calling record not found or unauthorized" });
    }

    const allowedFields = [
      "date", "outgoingCalls", "incomingCalls", "connectedCalls",
      "notConnectedCalls", "interestedLeads", "notInterestedLeads",
      "followUpCalls", "followUpLeads", "conversionsDone", "revenueGenerated"
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        record[field] = req.body[field];
      }
    });

    await record.save();
    return res.status(200).json({
      message: "Calling record updated successfully",
      data: record
    });
  } catch (error) {
    return next(error);
  }
};
