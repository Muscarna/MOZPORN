CREATE TABLE "CreatorBlock" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CreatorBlock_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ContentFavorite" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentFavorite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CreatorBlock_userId_creatorId_key" ON "CreatorBlock"("userId", "creatorId");
CREATE INDEX "CreatorBlock_userId_idx" ON "CreatorBlock"("userId");
CREATE INDEX "CreatorBlock_creatorId_idx" ON "CreatorBlock"("creatorId");
CREATE UNIQUE INDEX "ContentFavorite_userId_contentId_key" ON "ContentFavorite"("userId", "contentId");
CREATE INDEX "ContentFavorite_userId_createdAt_idx" ON "ContentFavorite"("userId", "createdAt");
CREATE INDEX "ContentFavorite_contentId_idx" ON "ContentFavorite"("contentId");
ALTER TABLE "CreatorBlock" ADD CONSTRAINT "CreatorBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreatorBlock" ADD CONSTRAINT "CreatorBlock_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentFavorite" ADD CONSTRAINT "ContentFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentFavorite" ADD CONSTRAINT "ContentFavorite_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
