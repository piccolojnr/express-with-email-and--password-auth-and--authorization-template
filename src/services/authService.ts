import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { UnauthorizedError, NotFoundError } from '@src/common/errors/ApiErrors';
import logger from '@src/common/utils/logger';
import { prisma } from '@src/common/utils/prisma';
import { LoginRequest, AuthResponse, AUTH_ERRORS, RefreshTokenRequest, ChangePasswordRequest, JWT_CONFIG, SESSION_EXPIRY, RegisterRequest } from '@src/models/auth';
import { transformUserToResponse, UserWithRoles } from '@src/models/user';

/******************************************************************************
                            Authentication Service
******************************************************************************/

class AuthService {
    private readonly jwtSecret: string;
    private readonly saltRounds = 12;

    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        if (process.env.NODE_ENV === 'production' && this.jwtSecret === 'your-secret-key') {
            logger.info('JWT_SECRET environment variable is not set for production');
            throw new Error('JWT_SECRET must be set in production');
        }
    }

    /**
     * Register new user (OPTIONAL - remove if not needed)
     */
    async register(data: RegisterRequest): Promise<AuthResponse> {
        logger.info(`Registration attempt for email: ${data.email}`);

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: data.email },
                    ...(data.username ? [{ username: data.username }] : []),
                ],
            },
        });

        if (existingUser) {
            if (existingUser.email === data.email) {
                throw new UnauthorizedError(AUTH_ERRORS.EMAIL_ALREADY_EXISTS);
            }
            if (existingUser.username === data.username) {
                throw new UnauthorizedError(AUTH_ERRORS.USERNAME_ALREADY_EXISTS);
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, this.saltRounds);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: data.email,
                username: data.username,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
            },
            include: {
                userRoles: {
                    include: {
                        role: true,
                    },
                },
            },
        });

        // Generate tokens and create session
        const tokens = await this.generateTokens(user);
        await this.createSession(user.id, tokens.refreshToken);

        // Log audit event
        await this.logAuditEvent(user.id, 'register');

        logger.info(`User registered successfully: ${user.id}`);

        return {
            user: transformUserToResponse(user),
            tokens,
        };
    }

    /**
     * Login user
     */
    async login(data: LoginRequest): Promise<AuthResponse> {
        logger.info(`Login attempt for email: ${data.email}`);

        // Find user with roles
        const user = await prisma.user.findUnique({
            where: { email: data.email },
            include: {
                userRoles: {
                    include: {
                        role: true,
                    },
                },
            },
        });

        if (!user) {
            throw new UnauthorizedError(AUTH_ERRORS.INVALID_CREDENTIALS);
        }

        if (!user.isActive) {
            throw new UnauthorizedError(AUTH_ERRORS.USER_INACTIVE);
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(data.password, user.password);
        if (!isValidPassword) {
            throw new UnauthorizedError(AUTH_ERRORS.INVALID_CREDENTIALS);
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        // Generate tokens and create session
        const tokens = await this.generateTokens(user);
        await this.createSession(user.id, tokens.refreshToken, data.rememberMe);

        // Log audit event
        await this.logAuditEvent(user.id, 'login');

        logger.info(`User logged in successfully: ${user.id}`);

        return {
            user: transformUserToResponse(user),
            tokens,
        };
    }

    /**
     * Refresh access token
     */
    async refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
        logger.info('Token refresh attempt');

        // Find session with user
        const session = await prisma.session.findUnique({
            where: { refreshToken: data.refreshToken },
            include: {
                user: {
                    include: {
                        userRoles: {
                            include: {
                                role: true,
                            },
                        },
                    },
                },
            },
        });

        if (!session || session.isRevoked || session.expiresAt < new Date()) {
            throw new UnauthorizedError(AUTH_ERRORS.INVALID_TOKEN);
        }

        if (!session.user.isActive) {
            throw new UnauthorizedError(AUTH_ERRORS.USER_INACTIVE);
        }

        // Generate new tokens
        const tokens = await this.generateTokens(session.user);

        // Update session with new refresh token
        await prisma.session.update({
            where: { id: session.id },
            data: {
                refreshToken: tokens.refreshToken,
                updatedAt: new Date(),
            },
        });

        logger.info(`Token refreshed for user: ${session.user.id}`);

        return {
            user: transformUserToResponse(session.user),
            tokens,
        };
    }

    /**
     * Logout user (revoke session)
     */
    async logout(refreshToken: string): Promise<void> {
        logger.info('Logout attempt');

        const session = await prisma.session.findUnique({
            where: { refreshToken },
        });

        if (session) {
            await prisma.session.update({
                where: { id: session.id },
                data: { isRevoked: true },
            });

            // Log audit event
            await this.logAuditEvent(session.userId, 'logout');

            logger.info(`User logged out: ${session.userId}`);
        }
    }

    /**
     * Change user password
     */
    async changePassword(
        userId: string,
        data: ChangePasswordRequest
    ): Promise<void> {
        logger.info(`Password change attempt for user: ${userId}`);

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundError(AUTH_ERRORS.USER_NOT_FOUND);
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(data.currentPassword, user.password);
        if (!isValidPassword) {
            throw new UnauthorizedError('Current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(data.newPassword, this.saltRounds);

        // Update password and revoke all sessions
        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: { password: hashedPassword },
            });

            // Revoke all user sessions to force re-login
            await tx.session.updateMany({
                where: { userId, isRevoked: false },
                data: { isRevoked: true },
            });
        });

        // Log audit event
        await this.logAuditEvent(userId, 'password_change');

        logger.info(`Password changed for user: ${userId}`);
    }

    /**
     * Verify JWT token and get user
     */
    async verifyToken(token: string): Promise<UserWithRoles> {
        try {
            const decoded = jwt.verify(token, this.jwtSecret) as JwtPayload;

            if (!decoded.sub) {
                throw new UnauthorizedError(AUTH_ERRORS.INVALID_TOKEN);
            }

            const user = await prisma.user.findUnique({
                where: { id: decoded.sub },
                include: {
                    userRoles: {
                        include: {
                            role: true,
                        },
                    },
                },
            });

            if (!user || !user.isActive) {
                throw new UnauthorizedError(AUTH_ERRORS.USER_NOT_FOUND);
            }

            return user;
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                throw new UnauthorizedError(AUTH_ERRORS.INVALID_TOKEN);
            }
            if (error instanceof jwt.TokenExpiredError) {
                throw new UnauthorizedError(AUTH_ERRORS.TOKEN_EXPIRED);
            }
            throw error;
        }
    }

    /**
     * Generate JWT tokens
     */
    private async generateTokens(user: UserWithRoles): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }> {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            roles: user.userRoles.map((ur: any) => ur.role.name),
        };

        const accessToken = jwt.sign(payload, this.jwtSecret, {
            expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
        });

        const refreshToken = randomBytes(64).toString('hex');

        return {
            accessToken,
            refreshToken,
            expiresIn: 15 * 60, // 15 minutes in seconds
        };
    }

    /**
     * Create session record
     */
    private async createSession(
        userId: string,
        refreshToken: string,
        rememberMe: boolean = false
    ): Promise<void> {
        const expirySeconds = rememberMe
            ? SESSION_EXPIRY.REMEMBER_ME
            : SESSION_EXPIRY.DEFAULT;

        const expiresAt = new Date(Date.now() + expirySeconds * 1000);

        await prisma.session.create({
            data: {
                userId,
                refreshToken,
                expiresAt,
            },
        });
    }

    /**
     * Log audit event (OPTIONAL - for authorization and monitoring)
     */
    private async logAuditEvent(
        userId: string,
        action: string,
        details?: any
    ): Promise<void> {
        try {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action,
                    details: details || {},
                    createdAt: new Date(),
                },
            });
        } catch (error: any) {
            logger.info('Failed to log audit event: ' + String(error));
            // Don't throw error for audit logging failures
        }
    }

    /**
     * Clean expired sessions
     */
    async cleanExpiredSessions(): Promise<void> {
        const deletedSessions = await prisma.session.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { isRevoked: true },
                ],
            },
        });

        logger.info(`Cleaned ${deletedSessions.count} expired sessions`);
    }
}

/******************************************************************************
                                Export
******************************************************************************/

const authService = new AuthService();
export default authService;
