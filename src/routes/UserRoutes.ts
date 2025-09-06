import { Router, type Request, type Response } from 'express';
import { createSuccessResponse } from '../common/types/ApiResponse.js';
import { authenticate, authorize, getCurrentUser } from '../common/middlewares/authMiddleware.js';
import { asyncHandler } from '../common/middlewares/errorHandlers.js';
import logger from '../common/utils/logger.js';
import Paths from '@src/common/constants/Paths.js';

/******************************************************************************
                                Router Setup
******************************************************************************/

const router = Router();

/******************************************************************************
                            User Routes (OPTIONAL - for authorization)
******************************************************************************/

/**
 * GET /users/
 * Get all users (admin only)
 */
router.get(Paths.Users.GetAll, authenticate, authorize(['admin']), asyncHandler(async (req: Request, res: Response) => {
    logger.info('Get all users request');

    // Implement user listing logic here
    const response = createSuccessResponse([], 'Users retrieved successfully');
    res.status(200).json(response);
}));

/**
 * GET /users/:id
 * Get user by ID
 */
router.get(Paths.Users.GetById, authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUser = getCurrentUser(req);

    logger.info(`Get user request for ID: ${id}`);

    // Only allow users to view their own profile unless they're admin
    if (id !== currentUser.id && !currentUser.userRoles.some(ur => ur.role.name === 'admin')) {
        return res.status(403).json(createSuccessResponse(null, 'Access denied'));
    }

    // Implement user retrieval logic here
    const response = createSuccessResponse(currentUser, 'User retrieved successfully');
    res.status(200).json(response);
}));

/**
 * PUT /users/:id
 * Update user (admin or self)
 */
router.put(Paths.Users.Update, authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUser = getCurrentUser(req);

    logger.info(`Update user request for ID: ${id}`);

    // Only allow users to update their own profile unless they're admin
    if (id !== currentUser.id && !currentUser.userRoles.some(ur => ur.role.name === 'admin')) {
        return res.status(403).json(createSuccessResponse(null, 'Access denied'));
    }

    // Implement user update logic here
    const response = createSuccessResponse(null, 'User updated successfully');
    res.status(200).json(response);
}));

/******************************************************************************
                                Export
******************************************************************************/

export default router;
