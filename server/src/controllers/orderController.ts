import type { Request, Response } from "express";
// import prisma from "../prisma/client";
import { prisma } from "../../lib/prisma";
import type { AuthRequest } from "../types";
import {
  createOrderSchema,
  addOrderItemSchema,
  updateOrderStatusSchema,
  markOrderPaidSchema,
} from "../validation/index";

// Create New Order (by Waiter)
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const data = createOrderSchema.parse(req.body);
    const waiter = req.user!;

    if (waiter.role !== "waiter" && waiter.role !== "branch_admin") {
      return res
        .status(403)
        .json({ success: false, message: "Only waiters can create orders" });
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
          branchId: waiter.branchId!,
          waiterId: waiter.id,
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

    // Check if user is authorized (waiter who created it or branch admin)
    if (req.user!.role !== "waiter" && req.user!.role !== "branch_admin") {
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
    const { status } = updateOrderStatusSchema.parse(req.body)

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status,
        ...(status === "completed" && { completedAt: new Date() }),
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
            },
        });

        res.json({
            success: true,
            data: order,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch order details" });
    }
};