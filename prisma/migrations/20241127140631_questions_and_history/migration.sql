-- AlterTable
ALTER TABLE "role" ALTER COLUMN "description" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER NOT NULL,
    "upload_id" INTEGER NOT NULL,
    "uploadHistoryId" INTEGER NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_history" (
    "id" SERIAL NOT NULL,
    "client_type" TEXT,
    "user_id" TEXT,
    "history" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_uploadHistoryId_fkey" FOREIGN KEY ("uploadHistoryId") REFERENCES "upload_history"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
