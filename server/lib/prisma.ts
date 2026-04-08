import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ====================== SOFT DELETE MIDDLEWARE ======================
// @ts-expect-error: $use is not typed on PrismaClient when using a custom adapter
(prisma as any).$use(async (params, next) => {
  const model = params.model

  // List of models that support soft delete
  const softDeleteModels = [
    'Branch',
    'User',
    'MainCategory',
    'Subcategory',
    'MenuItem',
    'Supplier',
    'StoreItem',
    'StoreItemVariant',
    'BranchInventory',
    'PurchaseBatch',
    'DailyUsage',
    'Order',
    'OrderItem',
    // Add more models here if needed
  ]

  // ====================== FIND QUERIES ======================
  if (params.action === 'findUnique' || 
      params.action === 'findFirst' || 
      params.action === 'findMany') {
    
    // Add deletedAt filter automatically
    if (softDeleteModels.includes(model)) {
      params.args = params.args || {}
      params.args.where = {
        ...params.args.where,
        deletedAt: null,
      }
    }
  }

  // ====================== DELETE QUERIES → Convert to Soft Delete ======================
  if (params.action === 'delete') {
    if (softDeleteModels.includes(model)) {
      params.action = 'update'
      params.args.data = {
        deletedAt: new Date(),
      }
    }
  }

  if (params.action === 'deleteMany') {
    if (softDeleteModels.includes(model)) {
      params.action = 'updateMany'
      params.args.data = {
        deletedAt: new Date(),
      }
    }
  }

  return next(params)
})

export { prisma };
