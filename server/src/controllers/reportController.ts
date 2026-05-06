import type { Request, Response } from "express";
// import prisma from "../../prisma/client";
import { prisma } from "../../lib/prisma"
import type { AuthRequest } from "../types";
// import type { AuthRequest } from "../middleware/authMiddleware";
export const getDailyReport = async (req: AuthRequest, res: Response) => {
  try {
    const { branchId, date } = req.query;
    if (!branchId || !date) {
      return res.status(400).json({ success: false, message: "branchId and date are required" });
    }

    const queryDate = new Date(date as string);
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

    // Sales metrics
    const orders = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      _count: { id: true },
      where: {
        branchId: branchId as string,
        createdAt: { gte: startOfDay, lte: endOfDay },
        status: { not: "cancelled" },
      },
    });

    // Purchase metrics
    const purchases = await prisma.purchaseBatch.aggregate({
      _sum: { totalCost: true },
      where: {
        branchId: branchId as string,
        purchaseDate: { gte: startOfDay, lte: endOfDay },
        status: "approved",
        deletedAt: null,
      },
    });

    // Usage metrics
    const usage = await prisma.dailyUsage.aggregate({
      _sum: { totalCost: true },
      where: {
        branchId: branchId as string,
        usageDate: { gte: startOfDay, lte: endOfDay },
        deletedAt: null,
      },
    });

    res.json({
      success: true,
      data: {
        totalSales: orders._sum.totalAmount || 0,
        totalOrders: orders._count.id || 0,
        totalPurchases: purchases._sum.totalCost || 0,
        totalUsageCost: usage._sum.totalCost || 0,
        date: startOfDay,
      },
    });
  } catch (error: any) {
    console.error("Error in getDailyReport:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch daily report" });
  }
};

export const getWeeklyReport = async (req: AuthRequest, res: Response) => {
  try {
    const { branchId, startDate, endDate } = req.query;
    if (!branchId || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: "branchId, startDate, and endDate are required" });
    }

    const start = new Date(startDate as string);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);

    // Sales metrics
    const orders = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      _count: { id: true },
      where: {
        branchId: branchId as string,
        createdAt: { gte: start, lte: end },
        status: { not: "cancelled" },
      },
    });

    // Purchase metrics
    const purchases = await prisma.purchaseBatch.aggregate({
      _sum: { totalCost: true },
      where: {
        branchId: branchId as string,
        purchaseDate: { gte: start, lte: end },
        status: "approved",
        deletedAt: null,
      },
    });

    // Usage metrics
    const usage = await prisma.dailyUsage.aggregate({
      _sum: { totalCost: true },
      where: {
        branchId: branchId as string,
        usageDate: { gte: start, lte: end },
        deletedAt: null,
      },
    });

    res.json({
      success: true,
      data: {
        totalSales: orders._sum.totalAmount || 0,
        totalOrders: orders._count.id || 0,
        totalPurchases: purchases._sum.totalCost || 0,
        totalUsageCost: usage._sum.totalCost || 0,
        startDate: start,
        endDate: end,
      },
    });
  } catch (error: any) {
    console.error("Error in getWeeklyReport:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch weekly report" });
  }
};

export const getMonthlyReport = async (req: AuthRequest, res: Response) => {
  try {
    const { branchId, month } = req.query; // format: 'YYYY-MM'
    if (!branchId || !month) {
      return res.status(400).json({ success: false, message: "branchId and month (YYYY-MM) are required" });
    }

    // Orders don't have a monthly view, so we aggregate them
    const monthParam = month as string;
    const [yearStr = "", monthStr = ""] = monthParam.split("-");
    const startOfMonth = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
    const endOfMonth = new Date(parseInt(yearStr), parseInt(monthStr), 0, 23, 59, 59, 999);

    const orders = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      _count: { id: true },
      where: {
        branchId: branchId as string,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        status: { not: "cancelled" },
      },
    });

    // Use the views for purchases and usage
    const purchaseSummary = await prisma.$queryRaw<any[]>`
      SELECT SUM(total_amount_spent) as total_purchases 
      FROM branch_monthly_purchase_summary 
      WHERE branch_id = ${branchId}::uuid AND month = ${month}
    `;

    const usageSummary = await prisma.$queryRaw<any[]>`
      SELECT SUM(total_cost) as total_usage_cost 
      FROM branch_monthly_usage_summary 
      WHERE branch_id = ${branchId}::uuid AND month = ${month}
    `;

    res.json({
      success: true,
      data: {
        totalSales: orders._sum.totalAmount || 0,
        totalOrders: orders._count.id || 0,
        totalPurchases: purchaseSummary[0]?.total_purchases || 0,
        totalUsageCost: usageSummary[0]?.total_usage_cost || 0,
        month: month,
      },
    });
  } catch (error: any) {
    console.error("Error in getMonthlyReport:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch monthly report" });
  }
};

export const getCompanyReport = async (req: AuthRequest, res: Response) => {
  try {
    // Requires super_admin
    const inventorySummary = await prisma.$queryRaw<any[]>`
      SELECT * FROM company_inventory_summary
    `;

    const branchPerformance = await prisma.$queryRaw<any[]>`
      SELECT * FROM branch_performance_summary
    `;

    res.json({
      success: true,
      data: {
        companyInventory: inventorySummary[0] || {},
        branchPerformance: branchPerformance || [],
      },
    });
  } catch (error: any) {
    console.error("Error in getCompanyReport:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch company report" });
  }
};
