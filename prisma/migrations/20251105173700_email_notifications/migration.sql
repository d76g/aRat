-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailNotificationsInteractions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailNotificationsNews" BOOLEAN NOT NULL DEFAULT true;
