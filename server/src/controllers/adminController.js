import { Order } from "../models/Order.js";
import { ReturnRequest } from "../models/ReturnRequest.js";
import { CallingRecord } from "../models/CallingRecord.js";
import { User } from "../models/User.js";

const getDateRange = (filter, startDate, endDate) => {
  const now = new Date();
  let start, end;

  switch (filter) {
    case "yesterday": {
      start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "week": {
      start = new Date(now);
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "month": {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "custom": {
      start = startDate ? new Date(startDate) : new Date(0);
      end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);
      break;
    }
    default: {
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      break;
    }
  }

  return { start, end };
};

export const getEmployeePerformance = async (req, res, next) => {
  try {
    const { filter = "today", startDate, endDate } = req.query;
    const { start, end } = getDateRange(filter, startDate, endDate);

    const employees = await User.find({ role: "employee" }, { name: 1, email: 1 });

    const performance = await Promise.all(
      employees.map(async (emp) => {
        const [ordersToday, returnsToday, totalEntries] = await Promise.all([
          Order.countDocuments({
            employeeId: emp._id,
            createdAt: { $gte: start, $lte: end }
          }),
          ReturnRequest.countDocuments({
            employeeId: emp._id,
            createdAt: { $gte: start, $lte: end }
          }),
          Promise.all([
            Order.countDocuments({ employeeId: emp._id, createdAt: { $gte: start, $lte: end } }),
            ReturnRequest.countDocuments({ employeeId: emp._id, createdAt: { $gte: start, $lte: end } })
          ]).then(([o, r]) => o + r)
        ]);

        return {
          _id: emp._id,
          name: emp.name,
          email: emp.email,
          ordersToday,
          returnsToday,
          totalEntries
        };
      })
    );

    return res.status(200).json({ data: performance });
  } catch (error) {
    return next(error);
  }
};

export const getEmployeeHistory = async (req, res, next) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    const filter = {};

    if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [orders, returns] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }),
      ReturnRequest.find(filter).sort({ createdAt: -1 })
    ]);

    return res.status(200).json({ data: { orders, returns } });
  } catch (error) {
    return next(error);
  }
};

const buildDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) { const s = new Date(startDate); s.setHours(0, 0, 0, 0); filter.createdAt.$gte = s; }
    if (endDate) { const e = new Date(endDate); e.setHours(23, 59, 59, 999); filter.createdAt.$lte = e; }
  }
  return filter;
};

const buildCallingDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) { const s = new Date(startDate); s.setHours(0, 0, 0, 0); filter.date.$gte = s; }
    if (endDate) { const e = new Date(endDate); e.setHours(23, 59, 59, 999); filter.date.$lte = e; }
  }
  return filter;
};

export const getEmployeeDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const employee = await User.findById(id).select("-password");
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const orderFilter = { employeeId: id, ...buildDateFilter(startDate, endDate) };
    const returnFilter = { employeeId: id, ...buildDateFilter(startDate, endDate) };
    const callFilter = { employeeId: id, ...buildCallingDateFilter(startDate, endDate) };

    const [orders, returns, callingRecords] = await Promise.all([
      Order.find(orderFilter).sort({ createdAt: -1 }),
      ReturnRequest.find(returnFilter).sort({ createdAt: -1 }),
      CallingRecord.find(callFilter).sort({ date: -1, createdAt: -1 })
    ]);

    return res.status(200).json({
      data: {
        employee,
        orders,
        returns,
        callingRecords
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const getEmployeeSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const employees = await User.find({ role: "employee" }).select("-password").lean();
    const orderFilter = buildDateFilter(startDate, endDate);
    const returnFilter = buildDateFilter(startDate, endDate);
    const callFilter = buildCallingDateFilter(startDate, endDate);

    const summary = await Promise.all(
      employees.map(async (emp) => {
        const [orderCount, returnCount, callingCount] = await Promise.all([
          Order.countDocuments({ employeeId: emp._id, ...orderFilter }),
          ReturnRequest.countDocuments({ employeeId: emp._id, ...returnFilter }),
          CallingRecord.countDocuments({ employeeId: emp._id, ...callFilter })
        ]);
        return { ...emp, orderCount, returnCount, callingCount };
      })
    );

    return res.status(200).json({ data: summary });
  } catch (error) {
    return next(error);
  }
};
