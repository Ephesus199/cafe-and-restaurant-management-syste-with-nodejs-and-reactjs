-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'branch_admin', 'store_manager', 'waiter', 'cashier', 'staff', 'chef');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'preparing', 'ready', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('unpaid', 'paid', 'refunded');

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "branch_code" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "postal_code" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "opening_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT,
    "role" "UserRole" NOT NULL,
    "branch_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_transfer_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "from_branch_id" UUID,
    "to_branch_id" UUID NOT NULL,
    "transfer_date" DATE NOT NULL,
    "role_at_new_branch" TEXT NOT NULL,
    "approved_by" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_transfer_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "main_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "main_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcategories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "main_category_id" UUID NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "image_url" TEXT,
    "description" TEXT,
    "calories" INTEGER,
    "preparation_time" INTEGER,
    "subcategory_id" UUID NOT NULL,
    "default_available" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_availability_exceptions" (
    "menu_item_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "is_available" BOOLEAN NOT NULL,
    "updated_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_item_availability_exceptions_pkey" PRIMARY KEY ("menu_item_id","branch_id")
);

-- CreateTable
CREATE TABLE "branch_privileges" (
    "branch_id" UUID NOT NULL,
    "can_edit_name" BOOLEAN NOT NULL DEFAULT false,
    "can_edit_price" BOOLEAN NOT NULL DEFAULT false,
    "can_edit_image" BOOLEAN NOT NULL DEFAULT false,
    "can_edit_description" BOOLEAN NOT NULL DEFAULT false,
    "can_edit_calories" BOOLEAN NOT NULL DEFAULT false,
    "can_edit_preparation_time" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branch_privileges_pkey" PRIMARY KEY ("branch_id")
);

-- CreateTable
CREATE TABLE "daily_specials" (
    "branch_id" UUID NOT NULL,
    "subcategory_id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "daily_specials_pkey" PRIMARY KEY ("branch_id","subcategory_id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "supplier_name" TEXT NOT NULL,
    "contact_person" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "store_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_items_variants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_item_id" UUID NOT NULL,
    "variant_name" TEXT NOT NULL,
    "base_unit" TEXT NOT NULL,
    "pack_unit" TEXT,
    "units_per_pack" INTEGER,
    "default_min_stock" DECIMAL(10,2) DEFAULT 0,
    "sku" TEXT,
    "barcode" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "store_items_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_inventory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "current_stock" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "min_stock_level" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "branch_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_batches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "supplier_id" UUID,
    "purchase_date" DATE NOT NULL,
    "quantity_purchased" DECIMAL(10,2) NOT NULL,
    "quantity_remaining" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "pack_price" DECIMAL(10,2),
    "total_cost" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "purchased_by" UUID NOT NULL,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "invoice_number" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "purchase_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_usage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "usage_date" DATE NOT NULL,
    "quantity_used" DECIMAL(10,2) NOT NULL,
    "total_cost" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "daily_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_batch_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usage_id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "quantity_used" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_batch_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "order_number" TEXT NOT NULL,
    "table_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "waiter_id" UUID NOT NULL,
    "chef_id" UUID,
    "cashier_id" UUID,
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paymentMethod" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'unpaid',
    "paid_at" TIMESTAMP(3),
    "customer_notes" TEXT,
    "kitchen_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "special_instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branches_name_key" ON "branches"("name");

-- CreateIndex
CREATE UNIQUE INDEX "branches_branch_code_key" ON "branches"("branch_code");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "main_categories_name_key" ON "main_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_main_category_id_name_key" ON "subcategories"("main_category_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "store_items_variants_sku_key" ON "store_items_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "store_items_variants_store_item_id_variant_name_key" ON "store_items_variants"("store_item_id", "variant_name");

-- CreateIndex
CREATE UNIQUE INDEX "branch_inventory_branch_id_variant_id_key" ON "branch_inventory"("branch_id", "variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_usage_branch_id_variant_id_usage_date_key" ON "daily_usage"("branch_id", "variant_id", "usage_date");

-- CreateIndex
CREATE UNIQUE INDEX "orders_branch_id_order_number_key" ON "orders"("branch_id", "order_number");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_transfer_history" ADD CONSTRAINT "user_transfer_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_transfer_history" ADD CONSTRAINT "user_transfer_history_from_branch_id_fkey" FOREIGN KEY ("from_branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_transfer_history" ADD CONSTRAINT "user_transfer_history_to_branch_id_fkey" FOREIGN KEY ("to_branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_transfer_history" ADD CONSTRAINT "user_transfer_history_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_main_category_id_fkey" FOREIGN KEY ("main_category_id") REFERENCES "main_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_availability_exceptions" ADD CONSTRAINT "menu_item_availability_exceptions_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_availability_exceptions" ADD CONSTRAINT "menu_item_availability_exceptions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_privileges" ADD CONSTRAINT "branch_privileges_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_specials" ADD CONSTRAINT "daily_specials_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_specials" ADD CONSTRAINT "daily_specials_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_specials" ADD CONSTRAINT "daily_specials_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_items_variants" ADD CONSTRAINT "store_items_variants_store_item_id_fkey" FOREIGN KEY ("store_item_id") REFERENCES "store_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_inventory" ADD CONSTRAINT "branch_inventory_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_inventory" ADD CONSTRAINT "branch_inventory_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "store_items_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_batches" ADD CONSTRAINT "purchase_batches_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_batches" ADD CONSTRAINT "purchase_batches_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "store_items_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_batches" ADD CONSTRAINT "purchase_batches_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_batches" ADD CONSTRAINT "purchase_batches_purchased_by_fkey" FOREIGN KEY ("purchased_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_batches" ADD CONSTRAINT "purchase_batches_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_usage" ADD CONSTRAINT "daily_usage_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_usage" ADD CONSTRAINT "daily_usage_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "store_items_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_usage" ADD CONSTRAINT "daily_usage_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_batch_details" ADD CONSTRAINT "usage_batch_details_usage_id_fkey" FOREIGN KEY ("usage_id") REFERENCES "daily_usage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_batch_details" ADD CONSTRAINT "usage_batch_details_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "purchase_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_waiter_id_fkey" FOREIGN KEY ("waiter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_chef_id_fkey" FOREIGN KEY ("chef_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_cashier_id_fkey" FOREIGN KEY ("cashier_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
