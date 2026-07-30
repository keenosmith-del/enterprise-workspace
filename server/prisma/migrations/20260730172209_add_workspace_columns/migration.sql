-- CreateTable
CREATE TABLE "WorkspaceColumn" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "tableId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceColumn_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WorkspaceColumn" ADD CONSTRAINT "WorkspaceColumn_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "WorkspaceTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
