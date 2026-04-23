/*
  Warnings:

  - A unique constraint covering the columns `[managed_branch_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "managed_branch_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "users_managed_branch_id_key" ON "users"("managed_branch_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_managed_branch_id_fkey" FOREIGN KEY ("managed_branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
