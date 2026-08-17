/*
  Warnings:

  - Added the required column `dataType` to the `WorkspaceColumn` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WorkspaceColumn" ADD COLUMN     "dataType" TEXT NOT NULL,
ADD COLUMN     "defaultValue" TEXT,
ADD COLUMN     "isNullable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isPrimaryKey" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isUnique" BOOLEAN NOT NULL DEFAULT false;
