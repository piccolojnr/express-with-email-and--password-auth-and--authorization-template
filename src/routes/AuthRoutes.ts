import { Router, type Request, type Response } from 'express';
import { createSuccessResponse } from '../common/types/ApiResponse.js';
import authService from '../services/authService.js';
import { authenticate, getCurrentUser, type AuthenticatedRequest } from '../common/middlewares/authMiddleware.js';
import { validateRequestBody } from '../common/utils/validation.js';
import { asyncHandler } from '../common/middlewares/errorHandlers.js';
import {
    LoginSchema,
    RegisterSchema,
    ChangePasswordSchema,
    RefreshTokenSchema,
    type LoginRequest,
    type RegisterRequest,
    type ChangePasswordRequest,
    type RefreshTokenRequest,
} from '../models/auth.js';
import logger from '../common/utils/logger.js';
import Paths from '@src/common/constants/Paths.js';

/******************************************************************************
                                Router Setup
******************************************************************************/

const router = Router();

/******************************************************************************
                            Authentication Routes
******************************************************************************/

/**
 * POST /auth/register  
 * Register new user (OPTIONAL - remove if not needed)
 */
router.post(Paths.Auth.Register, validateRequestBody(RegisterSchema), asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as RegisterRequest;

    logger.info('Registration request received for email: ' + data.email);

    const result = await authService.register(data);

    const response = createSuccessResponse(result, 'Registration successful');
    res.status(201).json(response);
}));

/**
 * POST /auth/login  
 * Login user
 */
router.post(Paths.Auth.Login, validateRequestBody(LoginSchema), asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as LoginRequest;

    logger.info('Login request received for email: ' + data.email);

    const result = await authService.login(data);

    const response = createSuccessResponse(result, 'Login successful');
    res.status(200).json(response);
}));

/**
 * POST /auth/refresh
 * Refresh access token
 */
router.post(Paths.Auth.Refresh, validateRequestBody(RefreshTokenSchema), asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as RefreshTokenRequest;

    logger.info('Token refresh request received');

    const result = await authService.refreshToken(data);

    const response = createSuccessResponse(result, 'Token refreshed successfully');
    res.status(200).json(response);
}));

/**
 * POST /auth/logout
 * Logout user
 */
router.post(Paths.Auth.Logout, authenticate, asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.body.refreshToken;

    logger.info('Logout request received');

    if (refreshToken) {
        await authService.logout(refreshToken);
    }

    const response = createSuccessResponse(null, 'Logout successful');
    res.status(200).json(response);
}));

/**
 * POST /auth/change-password
 * Change user password
 */
router.post(Paths.Auth.ChangePassword, authenticate, validateRequestBody(ChangePasswordSchema), asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as ChangePasswordRequest;
    const user = getCurrentUser(req);

    logger.info(`Password change request for user: ${user.id}`);

    await authService.changePassword(user.id, data);

    const response = createSuccessResponse(null, 'Password changed successfully');
    res.status(200).json(response);
}));

/**
 * GET /auth/me
 * Get current user profile
 */
router.get(Paths.Auth.Me, authenticate, asyncHandler(async (req: Request, res: Response) => {
    const user = getCurrentUser(req);

    logger.info(`Profile request for user: ${user.id}`);

    const response = createSuccessResponse(user, 'Profile retrieved successfully');
    res.status(200).json(response);
}));

/******************************************************************************
                                Export
******************************************************************************/

export default router;
