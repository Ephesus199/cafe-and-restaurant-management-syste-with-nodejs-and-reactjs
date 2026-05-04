import type { Request, Response } from "express";
// import prisma from "../prisma/client";
import { prisma } from "../../lib/prisma";
import type { AuthRequest } from "../types";
import {
  createSupplierSchema,
  createStoreItemSchema,
  createStoreItemVariantSchema,
  createPurchaseBatchSchema,
  createDailyUsageSchema,
} from "../validation/index";

// ==================== SUPPLIERS ====================
export const createSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const data = createSupplierSchema.parse(req.body);

    const supplier = await prisma.supplier.create({
      data: {
        supplierName: data.supplierName,
        contactPerson: data.contactPerson ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        createdBy: req.user!.id,
      },
    });

    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: supplier,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSuppliers = async (req: Request, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { deletedAt: null },
      orderBy: { supplierName: "asc" },
    });

    res.json({ success: true, data: suppliers });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch suppliers" });
  }
};

// ==================== STORE ITEMS ====================
export const createStoreItem = async (req: AuthRequest, res: Response) => {
  try {
    const data = createStoreItemSchema.parse(req.body);


    const storeItem = await prisma.storeItem.create({
      data: {
        name: data.name,
        category: data.category === undefined ? null : data.category,
        description: data.description === undefined ? null : data.description,
        createdBy: req.user!.id,
      },
    });

    res.status(201).json({
      success: true,
      message: "Store item created successfully",
      data: storeItem,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getStoreItems = async (req: Request, res: Response) => {
  try {
    const items = await prisma.storeItem.findMany({
      where: { deletedAt: null },
      include: {
        variants: true,
      },
      orderBy: { name: "asc" },
    });

    res.json({ success: true, data: items });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch store items" });
  }
};

// ==================== STORE ITEM VARIANTS ====================
export const createStoreItemVariant = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const data = createStoreItemVariantSchema.parse(req.body);

    const variant = await prisma.storeItemVariant.create({
      data: {
        storeItemId: data.storeItemId,
        variantName: data.variantName,
        baseUnit: data.baseUnit,
        packUnit: data.packUnit === undefined ? null : data.packUnit,
        unitsPerPack: data.unitsPerPack === undefined ? null : data.unitsPerPack,
        defaultMinStock: data.defaultMinStock,
        sku: data.sku === undefined ? null : data.sku,
        barcode: data.barcode === undefined ? null : data.barcode,
        createdBy: req.user!.id,
      },
    });

    res.status(201).json({
      success: true,
      message: "Store item variant created successfully",
      data: variant,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== PURCHASE BATCHES ====================
export const createPurchaseBatch = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== "store_manager") {
      return res.status(403).json({
        success: false,
        message: "Only store managers can create purchase batches",
      });
    }

    if (!req.user!.branchId) {
      return res.status(400).json({
        success: false,
        message: "Store manager must belong to a branch",
      });
    }

    let { branchId } = req.params;
    if (Array.isArray(branchId)) branchId = branchId[0];
    if (!branchId) {
      return res.status(400).json({ success: false, message: "Branch ID is required" });
    }
    if (branchId !== req.user!.branchId) {
      return res.status(403).json({ success: false, message: "Access denied for this branch" });
    }

    const data = createPurchaseBatchSchema.parse(req.body);

    const variantIds = data.items.map((item) => item.variantId);
    const storeItemIds = data.items.map((item) => item.storeItemId);
    const uniqueVariantIds = [...new Set(variantIds)];
    const uniqueStoreItemIds = [...new Set(storeItemIds)];

    const storeItems = await prisma.storeItem.findMany({
      where: {
        id: { in: uniqueStoreItemIds },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (storeItems.length !== uniqueStoreItemIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more selected store items were not found",
      });
    }

    const variants = await prisma.storeItemVariant.findMany({
      where: {
        id: { in: uniqueVariantIds },
        deletedAt: null,
      },
      select: { id: true, storeItemId: true },
    });

    if (variants.length !== uniqueVariantIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more selected variants were not found",
      });
    }

    const variantStoreItemMap = new Map(variants.map((v) => [v.id, v.storeItemId]));
    const hasInvalidPair = data.items.some(
      (item) => variantStoreItemMap.get(item.variantId) !== item.storeItemId,
    );
    if (hasInvalidPair) {
      return res.status(400).json({
        success: false,
        message: "Selected variant does not belong to selected store item",
      });
    }

    const purchases = await prisma.$transaction(
      data.items.map((item) =>
        prisma.purchaseBatch.create({
          data: {
            branchId: req.user!.branchId!,
            variantId: item.variantId,
            ...(data.supplierId ? { supplierId: data.supplierId } : {}),
            purchaseDate: new Date(data.purchaseDate),
            quantityPurchased: item.quantityPurchased,
            quantityRemaining: item.quantityPurchased,
            unitPrice: item.unitPrice,
            ...(item.packPrice !== undefined ? { packPrice: item.packPrice } : {}),
            totalCost: item.quantityPurchased * item.unitPrice,
            ...(data.invoiceNumber ? { invoiceNumber: data.invoiceNumber } : {}),
            ...(data.notes ? { notes: data.notes } : {}),
            purchasedBy: req.user!.id,
            status: "pending",
          },
        }),
      ),
    );

    const totalCost = purchases.reduce((sum, purchase) => sum + Number(purchase.totalCost), 0);

    res.status(201).json({
      success: true,
      message: "Purchase batches created successfully (pending approval)",
      data: purchases,
      meta: {
        count: purchases.length,
        totalCost,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== DAILY USAGE ====================
export const createDailyUsage = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== "store_manager") {
      return res.status(403).json({
        success: false,
        message: "Only store managers can record daily usage",
      });
    }

    if (!req.user!.branchId) {
      return res.status(400).json({
        success: false,
        message: "Store manager must belong to a branch",
      });
    }

    let { branchId } = req.params;
    if (Array.isArray(branchId)) branchId = branchId[0];
    if (!branchId) {
      return res.status(400).json({ success: false, message: "Branch ID is required" });
    }
    if (branchId !== req.user!.branchId) {
      return res.status(403).json({ success: false, message: "Access denied for this branch" });
    }

    const data = createDailyUsageSchema.parse(req.body);

    const variant = await prisma.storeItemVariant.findFirst({
      where: { id: data.variantId, deletedAt: null },
      select: { id: true },
    });
    if (!variant) {
      return res.status(400).json({ success: false, message: "Variant not found" });
    }

    const usage = await prisma.dailyUsage.create({
      data: {
        branchId: req.user!.branchId!,
        variantId: data.variantId,
        usageDate: new Date(data.usageDate),
        quantityUsed: data.quantityUsed,
        ...(data.notes ? { notes: data.notes } : {}),
        createdBy: req.user!.id,
      },
    });

    res.status(201).json({
      success: true,
      message: "Daily usage recorded successfully",
      data: usage,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};


// ==================== BRANCH INVENTORY & STOCK STATUS ====================
export const getBranchInventory = async (req: AuthRequest, res: Response) => {
  try {
      let { branchId } = req.params;
      if (Array.isArray(branchId)) {
        branchId = branchId[0];
      }

      if (!branchId) {
        return res.status(400).json({ success: false, message: 'Branch ID is required' });
      }
    const currentUser = req.user!;

    // Branch Admin / Store Manager can only see their own branch
    if (currentUser.role === 'branch_admin' || currentUser.role === 'store_manager') {
      if (currentUser.branchId !== branchId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const inventory = await prisma.branchInventory.findMany({
      where: { 
        branchId,
        deletedAt: null 
      },
      include: {
        variant: {
          include: {
            storeItem: true
          }
        }
      },
      orderBy: {
        variant: {
          storeItem: {
            name: 'asc'
          }
        }
      }
    });

    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch branch inventory' });
  }
};

export const getLowStockItems = async (req: AuthRequest, res: Response) => {
  try {
      let { branchId } = req.params;
      if (Array.isArray(branchId)) {
        branchId = branchId[0];
      }

      if (!branchId) {
        return res.status(400).json({ success: false, message: 'Branch ID is required' });
      }
      
    const currentUser = req.user!;

    if (currentUser.role === 'branch_admin' || currentUser.role === 'store_manager') {
      if (currentUser.branchId !== branchId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const inventoryRows = await prisma.branchInventory.findMany({
      where: {
        branchId,
        deletedAt: null,
      },
      include: {
        variant: {
          include: {
            storeItem: true,
          },
        },
      },
    });

    const lowStock = inventoryRows.filter(
      (row) => Number(row.currentStock) < Number(row.minStockLevel),
    );

    res.json({
      success: true,
      data: lowStock,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch low stock items' });
  }
};

// ==================== PURCHASE APPROVAL ====================
export const approvePurchase = async (req: AuthRequest, res: Response) => {
  try {
      let { purchaseId } = req.params;
      if (Array.isArray(purchaseId)) {
        purchaseId = purchaseId[0];
      }
      if (!purchaseId) {
        return res.status(400).json({ success: false, message: 'Purchase ID is required' });
      }
    const currentUser = req.user!;

    const purchase = await prisma.purchaseBatch.findUnique({
      where: { id: purchaseId }
    });

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    // Only branch admin of the same branch can approve
    if (purchase.branchId !== currentUser.branchId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const approvedPurchase = await prisma.purchaseBatch.update({
      where: { id: purchaseId },
      data: {
        status: 'approved',
        approvedBy: currentUser.id,
        approvedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Purchase approved successfully',
      data: approvedPurchase
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve purchase' });
  }
};

export const getPurchasesByBranch = async (req: AuthRequest, res: Response) => {
  try {
    let { branchId } = req.params;
    if (Array.isArray(branchId)) branchId = branchId[0];
    if (!branchId) {
      return res.status(400).json({ success: false, message: "Branch ID is required" });
    }

    const currentUser = req.user!;
    if (currentUser.role !== "branch_admin" || currentUser.branchId !== branchId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const queryStatus = Array.isArray(req.query.status) ? req.query.status[0] : req.query.status;
    const status = typeof queryStatus === "string" ? queryStatus : undefined;

    const purchases = await prisma.purchaseBatch.findMany({
      where: {
        branchId,
        deletedAt: null,
        ...(status ? { status } : {}),
      },
      include: {
        variant: {
          include: {
            storeItem: true,
          },
        },
        supplier: {
          select: {
            id: true,
            supplierName: true,
          },
        },
        purchasedByUser: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: purchases,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch purchases" });
  }
};