import { z } from 'zod';
import type { Role } from '@src/generated/prisma';

/******************************************************************************
                                Zod Schemas (OPTIONAL - for authorization)
******************************************************************************/

// Role creation schema
export const CreateRoleSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    displayName: z.string().min(2, 'Display name must be at least 2 characters').max(100),
    description: z.string().max(255).optional(),
    permissions: z.record(z.string(), z.any()).optional(), // JSON permissions object
});

// Role update schema
export const UpdateRoleSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
    displayName: z.string().min(2, 'Display name must be at least 2 characters').max(100).optional(),
    description: z.string().max(255).optional(),
    permissions: z.record(z.string(), z.any()).optional(), // JSON permissions object
    isActive: z.boolean().optional(),
});

// User role assignment schema
export const UserRoleSchema = z.object({
    userId: z.string().uuid(),
    roleId: z.string().uuid(),
});

/******************************************************************************
                                TypeScript Types
******************************************************************************/

export type CreateRoleRequest = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleRequest = z.infer<typeof UpdateRoleSchema>;
export type UserRoleAssignment = z.infer<typeof UserRoleSchema>;

// Role response type
export interface RoleResponse {
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    permissions: Record<string, any> | null;
    isSystem: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/******************************************************************************
                                Constants
******************************************************************************/

// Default system roles (OPTIONAL - customize based on your needs)
export const SYSTEM_ROLES = {
    ADMIN: {
        name: 'admin',
        displayName: 'Administrator',
        description: 'Full system access',
        permissions: {
            users: { create: true, read: true, update: true, delete: true },
            system: { admin: true, logs: true, settings: true },
        },
        isSystem: true,
    },
    USER: {
        name: 'user',
        displayName: 'User',
        description: 'Basic user access',
        permissions: {
            users: { read: false, update: false, delete: false },
            system: { admin: false, logs: false, settings: false },
        },
        isSystem: true,
    },
    MODERATOR: {
        name: 'moderator',
        displayName: 'Moderator',
        description: 'Moderation privileges',
        permissions: {
            users: { read: true, update: true, delete: false },
            system: { admin: false, logs: true, settings: false },
        },
        isSystem: true,
    },
} as const;
