generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id                 String         @id @default(uuid())
  tcNo               String         @unique
  tcNoEncrypted      String?
  email              String?
  password           String
  firstName          String
  lastName           String
  role               UserRole
  gender             Gender?
  phone              String?
  phoneEncrypted     String?
  dateOfBirth        DateTime?
  hospitalId         String?
  emailVerified      Boolean        @default(false)
  emailVerifiedAt    DateTime?
  verificationToken  String?        @unique
  createdAt          DateTime       @default(now())
  updatedAt          DateTime       @updatedAt
  doctorAppointments Appointment[]  @relation("DoctorAppointments")
  appointments       Appointment[]  @relation("PatientAppointments")
  availability       Availability[]
  emailLogs          EmailLog[]
  profilePicture     File?          @relation("UserProfilePicture")
  uploadedFiles      File[]         @relation("UserUploadedFiles")
  receivedMessages   Message[]      @relation("ReceivedMessages")
  messages           Message[]      @relation("SentMessages")
  notifications      Notification[]
  prescriptions      Prescription[]
  givenRatings       Rating[]       @relation("GivenRatings")
  ratings            Rating[]       @relation("ReceivedRatings")
  doctorReviews      Review[]       @relation("DoctorReviews")
  patientReviews     Review[]       @relation("PatientReviews")
  testResults        TestResult[]
  hospital           Hospital?      @relation("HospitalDoctors", fields: [hospitalId], references: [id])

  @@index([tcNo])
  @@index([email])
  @@index([role])
}

model Hospital {
  id           String        @id @default(uuid())
  name         String
  address      String?
  phone        String?
  email        String?
  city         String?
  district     String?
  isActive     Boolean       @default(true)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  appointments Appointment[]
  departments  Department[]
  doctors      User[]        @relation("HospitalDoctors")

  @@index([city])
}

model Department {
  id          String    @id @default(uuid())
  name        String
  description String?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  hospitalId  String?
  hospital    Hospital? @relation(fields: [hospitalId], references: [id])

  @@index([name])
}

model Appointment {
  id                 String            @id @default(uuid())
  patientId          String
  doctorId           String
  hospitalId         String
  departmentId       String?
  appointmentDate    DateTime
  status             AppointmentStatus @default("PENDING")
  notes              String?
  notesEncrypted     String?
  symptoms           String?
  symptomsEncrypted  String?
  diagnosis          String?
  diagnosisEncrypted String?
  reminderSent       Boolean           @default(false)
  reminder24hSent    Boolean           @default(false)
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt
  hospital           Hospital          @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  doctor             User              @relation("DoctorAppointments", fields: [doctorId], references: [id], onDelete: Cascade)
  patient            User              @relation("PatientAppointments", fields: [patientId], references: [id], onDelete: Cascade)

  @@index([patientId])
  @@index([doctorId])
  @@index([appointmentDate])
  @@index([status])
}

model Availability {
  id          String   @id @default(uuid())
  doctorId    String
  date        DateTime
  startTime   String
  endTime     String
  isAvailable Boolean  @default(true)
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  doctor      User     @relation(fields: [doctorId], references: [id], onDelete: Cascade)

  @@unique([doctorId, date, startTime])
  @@index([doctorId])
  @@index([date])
}

model Notification {
  id               String   @id @default(uuid())
  userId           String
  type             String
  message          String
  isRead           Boolean  @default(false)
  createdAt        DateTime @default(now())
  messageEncrypted String?
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
}

model TestResult {
  id               String   @id @default(uuid())
  patientId        String
  testName         String
  resultDate       DateTime
  status           String   @default("Sonuç Çıktı")
  doctorName       String
  results          String
  notes            String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  notesEncrypted   String?
  resultsEncrypted String?
  patient          User     @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@index([patientId])
  @@index([resultDate])
}

model Prescription {
  id                 String   @id @default(uuid())
  patientId          String
  doctorName         String
  date               DateTime
  diagnosis          String
  medications        String
  notes              String?
  status             String   @default("Onaylandı")
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  diagnosisEncrypted String?
  notesEncrypted     String?
  patient            User     @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@index([patientId])
  @@index([date])
}

model Review {
  id               String   @id @default(uuid())
  patientId        String
  doctorId         String
  rating           Int
  comment          String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  commentEncrypted String?
  doctor           User     @relation("DoctorReviews", fields: [doctorId], references: [id], onDelete: Cascade)
  patient          User     @relation("PatientReviews", fields: [patientId], references: [id], onDelete: Cascade)

  @@index([doctorId])
  @@index([patientId])
}

model Rating {
  id               String   @id @default(uuid())
  doctorId         String
  patientId        String
  rating           Int
  comment          String?
  createdAt        DateTime @default(now())
  commentEncrypted String?
  patient          User     @relation("GivenRatings", fields: [patientId], references: [id], onDelete: Cascade)
  doctor           User     @relation("ReceivedRatings", fields: [doctorId], references: [id], onDelete: Cascade)

  @@unique([doctorId, patientId])
  @@index([doctorId])
}

model Message {
  id               String   @id @default(uuid())
  senderId         String
  receiverId       String
  subject          String
  message          String
  isRead           Boolean  @default(false)
  createdAt        DateTime @default(now())
  messageEncrypted String?
  receiver         User     @relation("ReceivedMessages", fields: [receiverId], references: [id], onDelete: Cascade)
  sender           User     @relation("SentMessages", fields: [senderId], references: [id], onDelete: Cascade)

  @@index([senderId])
  @@index([receiverId])
  @@index([isRead])
}

model HealthRecord {
  id                   String   @id @default(uuid())
  patientId            String
  recordType           String
  title                String
  description          String
  recordDate           DateTime
  doctorName           String?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  descriptionEncrypted String?

  @@index([patientId])
  @@index([recordType])
}

model File {
  id                   String       @id @default(uuid())
  fileName             String
  originalName         String
  mimeType             String
  size                 Int
  path                 String
  uploadedBy           String
  profilePictureUserId String?      @unique
  category             FileCategory
  createdAt            DateTime     @default(now())
  userProfile          User?        @relation("UserProfilePicture", fields: [profilePictureUserId], references: [id])
  uploader             User         @relation("UserUploadedFiles", fields: [uploadedBy], references: [id], onDelete: Cascade)

  @@index([uploadedBy])
  @@index([category])
}

model EmailLog {
  id                String      @id @default(uuid())
  to                String
  toEncrypted       String?
  subject           String
  template          String
  status            EmailStatus @default("PENDING")
  sentAt            DateTime    @default(now())
  deliveredAt       DateTime?
  metadata          String?
  metadataEncrypted String?
  userId            String?
  user              User?       @relation(fields: [userId], references: [id])

  @@index([to])
  @@index([status])
  @@index([userId])
}

enum UserRole {
  ADMIN
  DOCTOR
  PATIENT
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
  SCHEDULED
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum FileCategory {
  PROFILE_PICTURE
  MESSAGE_ATTACHMENT
  TEST_RESULT
  MEDICAL_RECORD
  PRESCRIPTION
}

enum EmailStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
  BOUNCED
}


