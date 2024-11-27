/*
  Warnings:

  - You are about to drop the column `uploadHistoryId` on the `question` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "question" DROP CONSTRAINT "question_uploadHistoryId_fkey";

-- AlterTable
ALTER TABLE "question" DROP COLUMN "uploadHistoryId";

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "upload_history"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
