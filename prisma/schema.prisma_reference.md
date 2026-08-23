# Prisma Schema Reference for Google Drive Video & OAuth

Dưới đây là cấu trúc `schema.prisma` đã được tối ưu hóa để đáp ứng yêu cầu: Lưu trữ link Google Drive, Đăng nhập Google và Phân quyền theo danh sách (Enrollment).

```prisma
// Cấu hình Database
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

// 1. Phân quyền và Trạng thái
enum Role {
  USER
  ADMIN
}

enum Status {
  ACTIVE
  BANNED
}

enum CourseAccessType {
  FREE
  PAID
}

enum LessonAccessType {
  INHERIT
  FREE
  PAID
}

enum EnrollmentStatus {
  PENDING
  ACTIVE
  CANCELLED
}

// 2. Người dùng và Google OAuth
model User {
  id           Int          @id @default(autoincrement())
  email        String       @unique
  name         String?
  googleId     String?      @unique // Lưu ID từ Google OAuth
  passwordHash String?      // Nullable nếu chỉ dùng Google Login
  role         Role         @default(USER)
  status       Status       @default(ACTIVE)
  enrollments  Enrollment[]
  createdAt    DateTime     @default(now())
  
  @@map("users")
}

// 3. Khóa học và Bài học
model Course {
  id          Int              @id @default(autoincrement())
  title       String
  slug        String           @unique
  accessType  CourseAccessType @default(FREE)
  price       Decimal?         @db.Decimal(12, 2)
  enrollments Enrollment[]
  lessons     Lesson[]
  
  @@map("courses")
}

model Lesson {
  id          Int              @id @default(autoincrement())
  courseId    Int
  title       String
  position    Int
  accessType  LessonAccessType @default(INHERIT)
  isPublished Boolean          @default(false)
  video       Video?           // Quan hệ 1-1 với Video
  
  course      Course           @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  @@map("lessons")
}

// 4. CHỖ CHÈN LINK GOOGLE DRIVE
model Video {
  id         Int      @id @default(autoincrement())
  lessonId   Int      @unique
  
  // NƠI LƯU DRIVE FILE ID (Ví dụ: 1AbCDefGhijk123456)
  driveFileId String?  @map("external_id") 
  
  // NƠI LƯU LINK NHÚNG (Ví dụ: https://drive.google.com/file/d/ID/preview)
  embedUrl    String   
  
  lesson     Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  
  @@map("videos")
}

// 5. Danh sách Email được phép (Enrollment)
model Enrollment {
  id         Int              @id @default(autoincrement())
  userId     Int
  courseId   Int
  status     EnrollmentStatus @default(ACTIVE)
  
  user       User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  course     Course           @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseId])
  @@map("enrollments")
}
```
