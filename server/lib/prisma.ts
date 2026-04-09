// import "dotenv/config";
import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

dotenv.config({path:'../.env'});

const connectionString = `${process.env.DATABASE_URL}`;
console.log("Connecting to database with connection string:", connectionString);

const softDeleteModels = [
  "Branch",
  "User",
  "MainCategory",
  "Subcategory",
  "MenuItem",
  "Supplier",
  "StoreItem",
  "StoreItemVariant",
  "BranchInventory",
  "PurchaseBatch",
  "DailyUsage",
  "Order",
  "OrderItem",
];
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter })

// ====================== SOFT DELETE MIDDLEWARE ======================


// (prisma as any).$extends(async (params, next) => {
//   const model = params.model


//   const softDeleteModels = [
//     'Branch',
//     'User',
//     'MainCategory',
//     'Subcategory',
//     'MenuItem',
//     'Supplier',
//     'StoreItem',
//     'StoreItemVariant',
//     'BranchInventory',
//     'PurchaseBatch',
//     'DailyUsage',
//     'Order',
//     'OrderItem',
  
//   ]

//   if (params.action === 'findUnique' || 
//       params.action === 'findFirst' || 
//       params.action === 'findMany') {
    
//     if (softDeleteModels.includes(model)) {
//       params.args = params.args || {}
//       params.args.where = {
//         ...params.args.where,
//         deletedAt: null,
//       }
//     }
//   }

//   if (params.action === 'delete') {
//     if (softDeleteModels.includes(model)) {
//       params.action = 'update'
//       params.args.data = {
//         deletedAt: new Date(),
//         updatedAt: new Date(), 
//       }
//     }
//   }

//   if (params.action === 'deleteMany') {
//     if (softDeleteModels.includes(model)) {
//       params.action = 'updateMany'
//       params.args.data = {
//         deletedAt: new Date(),
//       }
//     }
//   }

//   if (["update", "updateMany"].includes(params.action)) {
//     if (softDeleteModels.includes(model)) {
      
//       params.args.data = {
//         ...params.args.data,
//         updatedAt: new Date(),
//       };
//     }
//   }

//   return next(params)
// })

export { prisma };
