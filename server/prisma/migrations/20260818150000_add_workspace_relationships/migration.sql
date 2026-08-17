-- AlterTable
ALTER TABLE "WorkspaceColumn"
ADD COLUMN "foreignKeyTableId" INTEGER,
ADD COLUMN "foreignKeyColumnId" INTEGER;

-- AddForeignKey
ALTER TABLE "WorkspaceColumn"
ADD CONSTRAINT "WorkspaceColumn_foreignKeyTableId_fkey"
FOREIGN KEY ("foreignKeyTableId")
REFERENCES "WorkspaceTable"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceColumn"
ADD CONSTRAINT "WorkspaceColumn_foreignKeyColumnId_fkey"
FOREIGN KEY ("foreignKeyColumnId")
REFERENCES "WorkspaceColumn"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;