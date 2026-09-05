-- CreateIndex
CREATE UNIQUE INDEX "Answer_entryId_questionId_key" ON "Answer"("entryId", "questionId");
