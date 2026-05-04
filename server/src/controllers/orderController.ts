import type { Request, Response } from "express";
// import prisma from "../prisma/client";
import { prisma } from "../../lib/prisma";
import type { AuthRequest } from "../types";
import {
  createOrderSchema,
  addOrderItemSchema,
  updateOrderStatusSchema,
  markOrderPaidSchema,
  viewOrdersQuerySchema,
} from "../validation/index";

// Create New Order (by Waiter)
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const data = createOrderSchema.parse(req.body);
    const actor = req.user!;

    // Determine which waiter the order should belong to.
    // - waiter: order belongs to themselves
    // - cashier: order belongs to the selected waiterId
    let targetWaiterId: string;
    if (actor.role === "waiter") {
      // Waiters must create orders for themselves.
      if (!data.waiterId || data.waiterId !== actor.id) {
        return res.status(403).json({
          success: false,
          message: "Invalid waiterId for the current waiter",
        });
      }

      targetWaiterId = actor.id;
    } else if (actor.role === "cashier") {
      if (!actor.branchId) {
        return res.status(400).json({
          success: false,
          message: "Cashier is not associated with a branch",
        });
      }

      // Validate selected waiter is in the same branch and is actually a waiter.
      const selectedWaiter = await prisma.user.findFirst({
        where: {
          id: data.waiterId,
          role: "waiter",
          deletedAt: null,
          branchId: actor.branchId,
        },
        select: { id: true },
      });

      if (!selectedWaiter) {
        return res.status(403).json({
          success: false,
          message: "Selected waiter is not valid for this branch",
        });
      }

      targetWaiterId = data.waiterId;
    } else {
      return res
        .status(403)
        .json({ success: false, message: "Only waiters and cashiers can create orders" });
    }

    const menuItemIds = data.items.map((item) => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
      },
      select: {
        id: true,
        price: true,
      },
    });

    if (menuItems.length !== menuItemIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more menu items were not found",
      });
    }

    const menuPriceMap = new Map(
      menuItems.map((menuItem) => [menuItem.id, Number(menuItem.price)]),
    );

    const orderItemsPayload = data.items.map((item) => {
      const unitPrice = menuPriceMap.get(item.menuItemId)!;
      const quantity = Number(item.quantity);

      return {
        menuItemId: item.menuItemId,
        quantity,
        unitPrice,
        subtotal: unitPrice * quantity,
        specialInstructions: item.specialInstructions ?? null,
        status: "pending" as const,
      };
    });

    const subtotal = orderItemsPayload.reduce((sum, item) => sum + item.subtotal, 0);

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          branchId: actor.branchId!,
          waiterId: targetWaiterId,
          // Only cashiers should set cashierId; waiter-created orders keep it NULL.
          ...(actor.role === "cashier" ? { cashierId: actor.id } : { cashierId: null }),
          tableNumber: data.tableNumber ?? null,
          customerNotes: data.customerNotes ?? null,
          kitchenNotes: data.kitchenNotes ?? null,
          status: "pending",
          subtotal,
          totalAmount: subtotal,
          items: {
            create: orderItemsPayload,
          },
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      return createdOrder;
    });

    res.status(201).json({
      success: true,
      message: "Order and items created successfully",
      data: order,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Add Item to Order
export const addOrderItem = async (req: AuthRequest, res: Response) => {
    try {
    

        let { orderId } = req.params;
        if (Array.isArray(orderId)) {
            orderId = orderId[0];
        }
        if (!orderId) {
            return res.status(400).json({ success: false, message: "Order ID is required" });
        }
    const data = addOrderItemSchema.parse(req.body);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.deletedAt) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Check if user is authorized
    const actor = req.user!;
    if (actor.role !== "waiter" && actor.role !== "cashier") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // cashier can only add items to orders created by them
    // waiter can only add items to orders they own
    if (actor.role === "waiter") {
      if (order.waiterId !== actor.id) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
      }
    } else if (actor.role === "cashier") {
      if (order.cashierId !== actor.id) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
      }
    } else {
      // branch_admin and other roles are not allowed by route middleware
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const menuItem = await prisma.menuItem.findUnique({
      where: { id: data.menuItemId },
    });

    if (!menuItem) {
      return res
        .status(404)
        .json({ success: false, message: "Menu item not found" });
    }

    const orderItem = await prisma.orderItem.create({
      data: {
        orderId: orderId,
        menuItemId: data.menuItemId,
        quantity: Number(data.quantity),
        unitPrice: Number(menuItem.price),
        subtotal: Number(menuItem.price) * Number(data.quantity),
        specialInstructions: data.specialInstructions ?? null,
        status: "pending",
      },
      select: {
        id: true,
        orderId: true,
        menuItemId: true,
        quantity: true,
        unitPrice: true,
        subtotal: true,
        specialInstructions: true,
        status: true,
      } 
    });

    res.status(201).json({
      success: true,
      message: "Item added to order successfully",
      data: orderItem,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update Order Status (Chef / Waiter)
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
      let { orderId } = req.params;
      if (Array.isArray(orderId)) {
          orderId = orderId[0];
      }
      if (!orderId) {
          return res.status(400).json({ success: false, message: "Order ID is required" });
        }
    const { status } = updateOrderStatusSchema.parse(req.body);
    const actor = req.user!;

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        waiterId: true,
        branchId: true,
      },
    });

    if (!existingOrder || existingOrder.status === "cancelled") {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (actor.role === "chef") {
      if (!actor.branchId || existingOrder.branchId !== actor.branchId) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      const allowedChefTransitions = new Set(["preparing", "ready"]);
      if (existingOrder.status !== "pending" || !allowedChefTransitions.has(status)) {
        return res.status(400).json({
          success: false,
          message: "Chef can only change pending orders to preparing or ready.",
        });
      }
    } else if (actor.role === "waiter") {
      if (existingOrder.waiterId !== actor.id) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      if (existingOrder.status !== "ready" || status !== "served") {
        return res.status(400).json({
          success: false,
          message: "Waiter can only change ready orders to served.",
        });
      }
    } else {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === "served" && { completedAt: new Date() }),
      },
    });

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Mark Order as Paid (Cashier)
export const markOrderPaid = async (req: AuthRequest, res: Response) => {
  try {
      let { orderId } = req.params;
      if (Array.isArray(orderId)) {
          orderId = orderId[0];
      }
      if (!orderId) {
          return res.status(400).json({ success: false, message: "Order ID is required" });
      }
      const { paymentMethod } = markOrderPaidSchema.parse(req.body);

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "paid",
        paymentMethod: paymentMethod,
        paidAt: new Date(),
        cashierId: req.user!.id,
      },
    });

    res.json({
      success: true,
      message: "Order marked as paid successfully",
      data: order,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get Orders for a Branch
export const getOrdersByBranch = async (req: AuthRequest, res: Response) => {
  try {
      let { branchId } = req.params;
      if (Array.isArray(branchId)) {
          branchId = branchId[0];
      }
      if (!branchId) {
          return res.status(400).json({ success: false, message: "Branch ID is required" });
        }
    const currentUser = req.user!;

    if (currentUser.branchId !== branchId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const orders = await prisma.order.findMany({
      where: {
        branchId,
        deletedAt: null,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        waiter: {
          select: { fullName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

// Get Single Order Details
export const getOrderById = async (req: AuthRequest, res: Response) => {
    try {
        let { orderId } = req.params;
        if (Array.isArray(orderId)) {
            orderId = orderId[0];
        }
        if (!orderId) {
            return res.status(400).json({ success: false, message: "Order ID is required" });
        }

        const currentUser = req.user!;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        menuItem: true,
                    },
                },
                waiter: {
                    select: { fullName: true },
                },
                cashier: {
                    select: { fullName: true },
                },
            },
        });

        if (!order || order.deletedAt) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Enforce role-based access for order details
        if (currentUser.role === "waiter" && order.waiterId !== currentUser.id) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        if (
          (currentUser.role === "branch_admin" || currentUser.role === "cashier") &&
          order.branchId !== currentUser.branchId
        ) {
          return res.status(403).json({ success: false, message: "Access denied" });
        }

        res.json({
            success: true,
            data: order,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch order details" });
    }
};

// ========================= VIEW ORDERS =========================
// GET /api/orders/view
// Role-based rules:
// - waiter: sees only their own orders, for today only
// - branch_admin/cashier: sees orders for the selected waiter in their own branch, with day/week/month filters
// - super_admin: selects branch and waiter, then sees with day/week/month filters
export const viewOrders = async (req: AuthRequest, res: Response) => {
  try {
    const query = viewOrdersQuerySchema.parse(req.query);
    const currentUser = req.user!;

    const toLocalISODate = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };

    const parseLocalDate = (dateStr?: string) => {
      if (!dateStr) return new Date();
      // Ensure local-time parsing by appending time component without timezone.
      const parsed = new Date(`${dateStr}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) return new Date();
      return parsed;
    };

    const startOfDay = (d: Date) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x;
    };

    const endOfDay = (d: Date) => {
      const x = new Date(d);
      x.setHours(23, 59, 59, 999);
      return x;
    };

    const addDays = (d: Date, days: number) => {
      const x = new Date(d);
      x.setDate(x.getDate() + days);
      return x;
    };

    // Monday-Sunday week range.
    const getWeekRange = (reference: Date) => {
      const ref = startOfDay(reference);
      const day = ref.getDay(); // 0 (Sun) - 6 (Sat)
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = addDays(ref, diffToMonday);
      const sunday = addDays(monday, 6);
      return { gte: monday, lte: endOfDay(sunday) };
    };

    const getMonthRange = (reference: Date) => {
      const ref = reference;
      const first = new Date(ref.getFullYear(), ref.getMonth(), 1);
      const last = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
      return { gte: startOfDay(first), lte: endOfDay(last) };
    };

    const resolvedPeriod: "day" | "week" | "month" =
      currentUser.role === "chef" || currentUser.role === "waiter" ? "day" : query.period;

    // Defaults: today
    const today = new Date();
    const resolvedDateStr =
      currentUser.role === "waiter" || currentUser.role === "chef"
        ? toLocalISODate(today)
        : query.date || toLocalISODate(today);

    const where: any = {
      deletedAt: null,
    };

    if (currentUser.role === "waiter") {
      where.branchId = currentUser.branchId;
      where.waiterId = currentUser.id;
    } else if (currentUser.role === "chef") {
      if (!currentUser.branchId) {
        return res.status(400).json({ success: false, message: "Chef has no branch assigned." });
      }
      where.branchId = currentUser.branchId;
    } else if (currentUser.role === "branch_admin" || currentUser.role === "cashier") {
      if (!currentUser.branchId) {
        return res.status(400).json({ success: false, message: "User has no branch assigned." });
      }
      where.branchId = currentUser.branchId;
      if (query.waiterId) where.waiterId = query.waiterId;
    } else if (currentUser.role === "super_admin") {
      if (query.branchId) where.branchId = query.branchId;
      if (query.waiterId) where.waiterId = query.waiterId;
    } else {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const referenceDate = parseLocalDate(resolvedDateStr);

    const range =
      resolvedPeriod === "day"
        ? { gte: startOfDay(referenceDate), lte: endOfDay(referenceDate) }
        : resolvedPeriod === "week"
          ? getWeekRange(referenceDate)
          : getMonthRange(referenceDate);

    const orders = await prisma.order.findMany({
      where: {
        ...where,
        createdAt: {
          gte: range.gte,
          lte: range.lte,
        },
      },
      include: {
        items: {
          select: {
            id: true,
            quantity: true,
            specialInstructions: true,
            subtotal: true,
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
        waiter: {
          select: { id: true, fullName: true },
        },
        cashier: {
          select: { fullName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: orders,
      meta: {
        period: resolvedPeriod,
        date: resolvedDateStr,
        from: range.gte.toISOString(),
        to: range.lte.toISOString(),
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to fetch orders",
    });
  }
};