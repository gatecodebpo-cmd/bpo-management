import { Order } from "../models/Order.js";
import { ReturnRequest } from "../models/ReturnRequest.js";

export const getDashboardSummary = async (req, res, next) => {
  try {
    const [totalOrders, pendingOrders, deliveredOrders, totalReturns] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: "Pending" }),
      Order.countDocuments({ orderStatus: "Delivered" }),
      ReturnRequest.countDocuments()
    ]);
    return res.status(200).json({
      data: { totalOrders, pendingOrders, deliveredOrders, totalReturns }
    });
  } catch (error) {
    return next(error);
  }
};
