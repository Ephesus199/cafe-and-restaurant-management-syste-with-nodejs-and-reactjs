-- CreateTable
CREATE TABLE "main_category_translations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "main_category_id" UUID NOT NULL,
    "language_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "main_category_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcategory_translations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subcategory_id" UUID NOT NULL,
    "language_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "subcategory_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_translations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "menu_item_id" UUID NOT NULL,
    "language_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "menu_item_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "main_category_translations_main_category_id_language_code_key" ON "main_category_translations"("main_category_id", "language_code");

-- CreateIndex
CREATE UNIQUE INDEX "subcategory_translations_subcategory_id_language_code_key" ON "subcategory_translations"("subcategory_id", "language_code");

-- CreateIndex
CREATE UNIQUE INDEX "menu_item_translations_menu_item_id_language_code_key" ON "menu_item_translations"("menu_item_id", "language_code");

-- AddForeignKey
ALTER TABLE "main_category_translations" ADD CONSTRAINT "main_category_translations_main_category_id_fkey" FOREIGN KEY ("main_category_id") REFERENCES "main_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcategory_translations" ADD CONSTRAINT "subcategory_translations_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_translations" ADD CONSTRAINT "menu_item_translations_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
