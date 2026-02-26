// Global Type Definitions for LUMINEX Backend
import { UserRole, AppointmentStatus, Gender } from '@prisma/client';

// ============================================
// EXPRESS REQUEST/RESPONSE EXTENSIONS
// ============================================

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        tcNo: string;
        role: UserRole;
        firstName?: string;
        lastName?: string;
      };
    }
  }
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: ValidationError[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ValidationError {
  msg: string;
  param: string;
  location: 'body' | 'query' | 'params';
  value?: any;
}

// ============================================
// DTO TYPES
// ============================================

export interface RegisterDto {
  tcNo: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  email?: string;
  phone?: string;
  gender?: Gender;
  dateOfBirth?: string;
}

export interface LoginDto {
  tcNo: string;
  password: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface CreateAppointmentDto {
  hospitalId: string;
  doctorId: string;
  departmentId?: string;
  appointmentDate: string;
  notes?: string;
  symptoms?: string;
}

export interface UpdateAppointmentDto {
  status?: AppointmentStatus;
  diagnosis?: string;
  notes?: string;
}

export interface ForgotPasswordDto {
  tcNo: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

// ============================================
// AUTH TYPES
// ============================================

export interface JwtPayload {
  userId: string;
  tcNo: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface ResetTokenPayload extends JwtPayload {
  type: 'password_reset';
}

// ============================================
// USER TYPES
// ============================================

export interface UserResponse {
  id: string;
  tcNo: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  email?: string;
  phone?: string;
  gender?: Gender;
  dateOfBirth?: string;
  createdAt: Date;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

// ============================================
// APPOINTMENT TYPES
// ============================================

export interface AppointmentResponse {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  departmentId?: string;
  appointmentDate: Date;
  status: AppointmentStatus;
  notes?: string;
  symptoms?: string;
  diagnosis?: string;
  createdAt: Date;
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  hospital?: {
    id: string;
    name: string;
    city: string;
  };
}

// ============================================
// QUERY TYPES
// ============================================

export interface AppointmentQuery {
  status?: AppointmentStatus;
  startDate?: string;
  endDate?: string;
}

export interface SearchQuery {
  q?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

// ============================================
// ERROR TYPES
// ============================================

export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

// ============================================
// ENVIRONMENT TYPES
// ============================================

export interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT?: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET?: string;
  JWT_EXPIRE?: string;
  SESSION_SECRET?: string;
  CSRF_SECRET?: string;
  FRONTEND_URL: string;
  RATE_LIMIT_WINDOW_MS?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
  ENABLE_2FA?: string;
  ENABLE_AUDIT_LOGGING?: string;
  API_URL?: string;
}

// ============================================
// PRISMA TYPES
// ============================================

export * from '@prisma/client';

// Re-export Prisma enums for convenience
export type { UserRole, AppointmentStatus, Gender };
