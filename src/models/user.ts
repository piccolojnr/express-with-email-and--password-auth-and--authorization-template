import { z } from 'zod';
import type { User, Role, UserRole } from '@src/generated/prisma';

/******************************************************************************
                                Zod Schemas
******************************************************************************/

// User creation schema
export const CreateUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    roleIds: z.array(z.string()).optional(), // Optional for authorization systems
});

// User update schema
export const UpdateUserSchema = z.object({
    email: z.string().email('Invalid email format').optional(),
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    isActive: z.boolean().optional(),
    roleIds: z.array(z.string()).optional(), // Optional for authorization systems
});

// User query schema
export const UserQuerySchema = z.object({
    page: z.string().transform((val: string) => parseInt(val) || 1).optional(),
    limit: z.string().transform((val: string) => Math.min(parseInt(val) || 10, 100)).optional(),
    search: z.string().optional(),
    role: z.string().optional(),
    isActive: z.string().transform((val: string) => val === 'true').optional(),
    sortBy: z.enum(['email', 'firstName', 'lastName', 'createdAt', 'lastLogin']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
});

/******************************************************************************
                                TypeScript Types
******************************************************************************/

export type CreateUserRequest = z.infer<typeof CreateUserSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>;
export type UserQuery = z.infer<typeof UserQuerySchema>;

// Extended user type with relationships
export interface UserWithRoles extends User {
    userRoles: (UserRole & {
        role: Role;
    })[];
}

// User response type (without sensitive data)
export interface UserResponse {
    id: string;
    email: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLogin: Date | null;
    roles: {
        id: string;
        name: string;
        displayName: string;
    }[];
}

// User profile type (for current user)
export interface UserProfile extends UserResponse {
    permissions?: Record<string, any>;
}

/******************************************************************************
                                Utility Functions
******************************************************************************/

/**
 * Transform database user to response format
 */
export function transformUserToResponse(user: UserWithRoles): UserResponse {
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin,
        roles: user.userRoles.map(ur => ({
            id: ur.role.id,
            name: ur.role.name,
            displayName: ur.role.displayName,
        })),
    };
}

/**
 * Check if user has specific role (OPTIONAL - for authorization)
 */
export function userHasRole(user: UserWithRoles, roleName: string): boolean {
    return user.userRoles.some(ur => ur.role.name === roleName);
}

/**
 * Check if user has any of the specified roles (OPTIONAL - for authorization)
 */
export function userHasAnyRole(user: UserWithRoles, roleNames: string[]): boolean {
    return user.userRoles.some(ur => roleNames.includes(ur.role.name));
}

/**
 * Get user permissions from roles (OPTIONAL - for authorization)
 */
export function getUserPermissions(user: UserWithRoles): Record<string, any> {
    const permissions: Record<string, any> = {};

    user.userRoles.forEach(ur => {
        if (ur.role.permissions && typeof ur.role.permissions === 'object') {
            Object.assign(permissions, ur.role.permissions);
        }
    });

    return permissions;
}

/******************************************************************************
                                Constants
******************************************************************************/

// Common role names (OPTIONAL - customize based on your needs)
export const USER_ROLES = {
    ADMIN: 'admin',
    USER: 'user',
    MODERATOR: 'moderator',
} as const;

export type UserRoleName = typeof USER_ROLES[keyof typeof USER_ROLES];

export const DEFAULT_USER_QUERY = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt' as const,
    sortOrder: 'desc' as const,
};
