/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `store_items` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "store_items_name_key" ON "store_items"("name");
