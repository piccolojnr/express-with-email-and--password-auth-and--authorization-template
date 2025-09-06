import { Request, Response, NextFunction } from 'express';
import authService from '../../services/authService.js';
import { UnauthorizedError } from '../errors/ApiErrors.js';
import { AUTH_ERRORS } from '../../models/auth.js';
import { userHasAnyRole, type UserWithRoles } from '../../models/user.js';

/******************************************************************************
                            Extended Request Types
******************************************************************************/

export interface AuthenticatedRequest extends Request {
    user: UserWithRoles;
    sessionId?: string;
}

/******************************************************************************
                            Authentication Middleware
******************************************************************************/

/**
 * Middleware to authenticate JWT token
 */
export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.header('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError(AUTH_ERRORS.UNAUTHORIZED);
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        if (!token) {
            throw new UnauthorizedError(AUTH_ERRORS.UNAUTHORIZED);
        }

        // Verify token and get user
        const user = await authService.verifyToken(token);

        // Attach user to request
        (req as AuthenticatedRequest).user = user;

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to check if user has any of the required roles (OPTIONAL - for authorization)
 */
export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const authenticatedReq = req as AuthenticatedRequest;

        if (!authenticatedReq.user) {
            throw new UnauthorizedError(AUTH_ERRORS.UNAUTHORIZED);
        }

        if (!userHasAnyRole(authenticatedReq.user, roles)) {
            throw new UnauthorizedError(AUTH_ERRORS.INSUFFICIENT_PERMISSIONS);
        }

        next();
    };
};

/**
 * Middleware for admin-only routes (OPTIONAL - for authorization)
 */
export const adminOnly = authorize(['admin']);

/**
 * Middleware for authenticated users (any role)
 */
export const authenticated = authenticate;

/**
 * Optional authentication - attach user if token is present but don't fail if missing
 */
export const optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.header('Authorization');

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);

            if (token) {
                try {
                    const user = await authService.verifyToken(token);
                    (req as AuthenticatedRequest).user = user;
                } catch (error) {
                    // Ignore authentication errors for optional auth
                }
            }
        }

        next();
    } catch (error) {
        next();
    }
};

/******************************************************************************
                            Role Check Utilities (OPTIONAL - for authorization)
******************************************************************************/

/**
 * Check if authenticated user is admin
 */
export const isAdmin = (req: Request): boolean => {
    const authenticatedReq = req as AuthenticatedRequest;
    return userHasAnyRole(authenticatedReq.user, ['admin']);
};

/**
 * Get current user from request
 */
export const getCurrentUser = (req: Request): UserWithRoles => {
    const authenticatedReq = req as AuthenticatedRequest;
    return authenticatedReq.user;
};
