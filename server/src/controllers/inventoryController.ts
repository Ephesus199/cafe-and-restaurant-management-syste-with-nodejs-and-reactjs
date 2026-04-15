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

    const data = createPurchaseBatchSchema.parse(req.body);

    const purchase = await prisma.purchaseBatch.create({
      data: {
        branchId: req.user!.branchId!,
        variantId: data.variantId,
        ...(data.supplierId ? { supplierId: data.supplierId } : {}),
        purchaseDate: new Date(data.purchaseDate),
        quantityPurchased: data.quantityPurchased,
        quantityRemaining: data.quantityPurchased,
        unitPrice: data.unitPrice,
        ...(data.packPrice !== undefined ? { packPrice: data.packPrice } : {}),
        totalCost: data.quantityPurchased * data.unitPrice,
        ...(data.invoiceNumber ? { invoiceNumber: data.invoiceNumber } : {}),
        ...(data.notes ? { notes: data.notes } : {}),
        purchasedBy: req.user!.id,
        status: "pending",
      },
    });

    res.status(201).json({
      success: true,
      message: "Purchase batch created successfully (pending approval)",
      data: purchase,
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

    const data = createDailyUsageSchema.parse(req.body);

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

    const lowStock = await prisma.branchInventory.findMany({
      where: {
        branchId,
        deletedAt: null,
        currentStock: {
          lt: prisma.branchInventory.fields.minStockLevel
        }
      },
      include: {
        variant: {
          include: {
            storeItem: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: lowStock
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