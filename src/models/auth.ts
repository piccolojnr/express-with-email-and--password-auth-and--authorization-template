import { z } from 'zod';
import type { Session } from '@src/generated/prisma';

/******************************************************************************
                                Zod Schemas
******************************************************************************/

// Login schema
export const LoginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional().default(false),
});

// Register schema (optional - for user registration)
export const RegisterSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

// Change password schema
export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

// Refresh token schema
export const RefreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

/******************************************************************************
                                TypeScript Types
******************************************************************************/

export type LoginRequest = z.infer<typeof LoginSchema>;
export type RegisterRequest = z.infer<typeof RegisterSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenSchema>;

// JWT payload interface
export interface JwtPayload {
    sub: string; // user ID
    email: string;
    roles: string[];
    iat?: number;
    exp?: number;
    jti?: string; // JWT ID for token tracking
}

// Authentication response
export interface AuthResponse {
    user: {
        id: string;
        email: string;
        username: string | null;
        firstName: string | null;
        lastName: string | null;
        roles: {
            id: string;
            name: string;
            displayName: string;
        }[];
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
        expiresIn: number; // seconds
    };
}

// Session with user info
export interface SessionWithUser extends Session {
    user: {
        id: string;
        email: string;
        username: string | null;
        firstName: string | null;
        lastName: string | null;
        isActive: boolean;
        userRoles: {
            role: {
                id: string;
                name: string;
                displayName: string;
            };
        }[];
    };
}

/******************************************************************************
                                Constants
******************************************************************************/

// JWT configuration
export const JWT_CONFIG = {
    ACCESS_TOKEN_EXPIRES_IN: '15m', // 15 minutes
    REFRESH_TOKEN_EXPIRES_IN: '7d', // 7 days
    REMEMBER_ME_EXPIRES_IN: '30d', // 30 days for remember me
} as const;

// Session expiry times (in seconds)
export const SESSION_EXPIRY = {
    DEFAULT: 7 * 24 * 60 * 60, // 7 days
    REMEMBER_ME: 30 * 24 * 60 * 60, // 30 days
} as const;

// Auth error messages
export const AUTH_ERRORS = {
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_NOT_FOUND: 'User not found',
    USER_INACTIVE: 'Account is deactivated',
    INVALID_TOKEN: 'Invalid or expired token',
    TOKEN_EXPIRED: 'Token has expired',
    SESSION_EXPIRED: 'Session has expired',
    UNAUTHORIZED: 'Unauthorized access',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
    EMAIL_ALREADY_EXISTS: 'Email already exists',
    USERNAME_ALREADY_EXISTS: 'Username already exists',
} as const;

/******************************************************************************
                                Role Permissions (OPTIONAL - for authorization)
******************************************************************************/

// Role permissions structure
export interface RolePermissions {
    users: {
        create?: boolean;
        read?: boolean;
        update?: boolean;
        delete?: boolean;
    };
    system: {
        admin?: boolean;
        logs?: boolean;
        settings?: boolean;
    };
}

// Default permissions for roles (OPTIONAL - customize based on your needs)
export const DEFAULT_PERMISSIONS: Record<string, RolePermissions> = {
    admin: {
        users: { create: true, read: true, update: true, delete: true },
        system: { admin: true, logs: true, settings: true },
    },
    user: {
        users: { read: false, update: false, delete: false },
        system: { admin: false, logs: false, settings: false },
    },
    moderator: {
        users: { read: true, update: true, delete: false },
        system: { admin: false, logs: true, settings: false },
    },
};
