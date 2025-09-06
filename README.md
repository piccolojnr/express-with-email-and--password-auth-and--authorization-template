# Backend Template

A production-ready Node.js/TypeScript backend template with authentication and optional authorization.

## Features

- 🔐 **Authentication**: JWT-based authentication with refresh tokens
- 👥 **Authorization**: Role-based access control (optional)
- 🗃️ **Database**: PostgreSQL with Prisma ORM
- 📝 **Logging**: Structured logging with audit trails
- 🛡️ **Security**: Security headers, CORS, input validation
- 🔧 **TypeScript**: Full TypeScript support with strict configuration
- 📊 **Error Handling**: Centralized error handling with custom error types
- 🧪 **Validation**: Request validation with Zod schemas

## Quick Start

### 1. Clone and Setup

```bash
# Clone the template
git clone <your-repo-url>
cd backend-template

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### 2. Environment Configuration

Update `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mydb"

# JWT Secret (generate a strong secret for production)
JWT_SECRET="your-very-secure-secret-key-here"

# Server
PORT=8000
NODE_ENV=development
LOG_LEVEL=info
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:8000`

## Project Structure

```
src/
├── common/
│   ├── constants/       # Application constants
│   ├── errors/          # Custom error classes
│   ├── middlewares/     # Express middlewares
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── models/              # Data models and schemas
├── routes/              # API route definitions
├── services/            # Business logic services
├── index.ts             # Application entry point
└── server.ts            # Express server setup
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user (optional)
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user profile

### Health Check

- `GET /health` - Health check endpoint

## Authorization (Optional)

The template includes an optional role-based authorization system. To use it:

1. Keep the Role and UserRole models in your Prisma schema
2. Use the authorization middleware in your routes
3. Customize roles and permissions in `src/models/auth.ts`

To disable authorization:
1. Remove Role and UserRole models from Prisma schema
2. Remove role-related imports and middleware
3. Simplify the User model

## Database Schema

### Core Models (Required)
- `User` - User accounts
- `Session` - JWT refresh tokens
- `AuditLog` - Activity logging (optional)

### Authorization Models (Optional)
- `Role` - User roles
- `UserRole` - User-role associations

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `PORT` | Server port | 8000 |
| `NODE_ENV` | Environment (development/production) | development |
| `LOG_LEVEL` | Logging level | info |

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database

## Customization

### Adding New Routes

1. Create route file in `src/routes/`
2. Add route to `src/routes/index.ts`
3. Create corresponding service in `src/services/`
4. Add models/schemas in `src/models/`

### Adding Authorization

Use the provided middleware:

```typescript
import { authenticate, authorize } from '@middlewares/authMiddleware';

// Require authentication
router.get('/protected', authenticate, handler);

// Require specific role
router.get('/admin', authenticate, authorize(['admin']), handler);
```

### Custom Error Handling

Extend the base `ApiError` class:

```typescript
export class CustomError extends ApiError {
    constructor(message: string) {
        super(message, 400, 'CUSTOM_ERROR');
    }
}
```

## Production Deployment

1. Set strong `JWT_SECRET`
2. Use production database
3. Set `NODE_ENV=production`
4. Enable HTTPS
5. Configure proper CORS origins
6. Set up logging aggregation
7. Monitor error rates

## Security Considerations

- JWT tokens expire in 15 minutes
- Refresh tokens expire in 7 days (30 days with "remember me")
- Passwords are hashed with bcrypt (12 rounds)
- Security headers are automatically applied
- Input validation on all endpoints
- Audit logging for security events

## License

MIT License - feel free to use this template for your projects.
