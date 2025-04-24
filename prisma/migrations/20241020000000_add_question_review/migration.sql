-- Create QuestionReview table for spaced repetition system
CREATE TABLE "QuestionReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "interval" INTEGER NOT NULL,
    "easeFactor" DOUBLE PRECISION NOT NULL,
    "reviewCount" INTEGER NOT NULL,
    "nextReviewDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes to speed up queries
CREATE INDEX "QuestionReview_userId_idx" ON "QuestionReview"("userId");
CREATE INDEX "QuestionReview_questionId_idx" ON "QuestionReview"("questionId");
CREATE INDEX "QuestionReview_nextReviewDate_idx" ON "QuestionReview"("nextReviewDate");
CREATE INDEX "QuestionReview_createdAt_idx" ON "QuestionReview"("createdAt"); 