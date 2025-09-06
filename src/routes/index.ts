import { asyncHandler } from '@src/common/middlewares/errorHandlers'
import { type Request, type Response } from 'express';
import { Router } from 'express';
import AuthRoutes from './AuthRoutes'
import UserRoutes from './UserRoutes'
import RoleRoutes from './RoleRoutes'
import { createSuccessResponse } from '@src/common/types/ApiResponse'
import logger from '@utils/logger'
import Paths from '@src/common/constants/Paths';

/******************************************************************************
                                Setup
******************************************************************************/

const apiRouter = Router();

// API root endpoint
apiRouter.get('/', (req: Request, res: Response) => {
    logger.info('GET /api endpoint accessed');
    const response = createSuccessResponse({
        message: 'Welcome to Backend Template API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            api: Paths.Base,
            auth: Paths.Auth.Base,
            users: Paths.Users.Base,
            roles: Paths.Roles.Base, // Optional - for authorization
        }
    }, 'API is running successfully');

    res.status(200).json(response);
});

// Add route modules
apiRouter.use(Paths.Auth.Base, AuthRoutes);
apiRouter.use(Paths.Users.Base, UserRoutes);
apiRouter.use(Paths.Roles.Base, RoleRoutes); // Optional - for authorization

/******************************************************************************
                                Export default
******************************************************************************/

export default apiRouter;
