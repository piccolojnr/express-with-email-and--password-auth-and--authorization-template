# 🚀 Backend Template

## What You Have Created

Congratulations! You've successfully created a production-ready backend template from your hub-backend project. This template includes:

✅ **Core Authentication System**
- JWT-based authentication with refresh tokens
- User registration and login
- Password change functionality 
- Session management
- Secure token handling

✅ **Optional Authorization System**  
- Role-based access control (RBAC)
- User roles and permissions
- Middleware for route protection
- Admin and user role examples

✅ **Production-Ready Features**
- PostgreSQL database with Prisma ORM
- Structured logging and audit trails
- Error handling and validation
- Security headers and CORS
- TypeScript with strict configuration
- Environment-based configuration

✅ **Clean Architecture**
- Organized folder structure
- Separation of concerns
- Reusable middleware
- Type-safe API responses

## What Was Removed

From your original hub-backend, the following business-specific features were removed:
- Business/company management
- Employee management
- Business metrics and analytics
- Business member relationships
- Hub-spoke architecture specifics

## How to Use This Template

### Option 1: Authentication Only (Simplest)

If you only need authentication without roles:

1. **Remove Role Models** from `prisma/schema.prisma`:
   ```prisma
   // Remove these models:
   model Role { ... }
   model UserRole { ... }
   ```

2. **Update User Model**:
   ```prisma
   model User {
     // Remove:
     userRoles UserRole[]
   }
   ```

3. **Remove Role-Related Files**:
   - `src/models/role.ts`
   - `src/routes/RoleRoutes.ts` 
   - Remove role imports from other files

4. **Simplify Auth Middleware**:
   - Remove `authorize()` functions
   - Remove role checks

### Option 2: Full Template (Authentication + Authorization)

Keep everything as-is to have a complete auth system with roles.

## Quick Start Guide

### 1. Project Setup
```bash
# Clone your template to a new project
cp -r template/ my-new-project/
cd my-new-project/

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL and secrets
```

### 2. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### 3. Start Development
```bash
npm run dev
```

## Adding Your Business Logic

### 1. Create New Models
Add your business models to `prisma/schema.prisma`:
```prisma
model Product {
  id        String   @id @default(cuid())
  name      String
  price     Decimal
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 2. Create Services
```typescript
// src/services/ProductService.ts
class ProductService {
  async createProduct(data: CreateProductRequest) {
    // Your business logic
  }
}
```

### 3. Create Routes
```typescript
// src/routes/ProductRoutes.ts
router.post('/', authenticate, asyncHandler(async (req, res) => {
  // Your route logic
}));
```

### 4. Add to Route Index
```typescript
// src/routes/index.ts
import ProductRoutes from './ProductRoutes';
apiRouter.use('/products', ProductRoutes);
```

## Environment Variables

Update your `.env` file:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"
JWT_SECRET="your-super-secret-jwt-key"
PORT=8000
NODE_ENV=development
```

## Authentication Examples

### Protected Route
```typescript
router.get('/protected', authenticate, (req, res) => {
  const user = getCurrentUser(req);
  res.json({ message: `Hello ${user.email}` });
});
```

### Admin Only Route (if using roles)
```typescript
router.get('/admin', authenticate, authorize(['admin']), (req, res) => {
  res.json({ message: 'Admin only content' });
});
```

### API Usage
```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123!'
  })
});

const { data } = await response.json();
const { accessToken } = data.tokens;

// Authenticated request
const userResponse = await fetch('/api/auth/me', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

## Best Practices

### Security
- Always use HTTPS in production
- Set strong JWT secrets
- Regularly rotate secrets
- Validate all inputs
- Use rate limiting for auth endpoints

### Database
- Run migrations before deployment
- Backup database regularly
- Monitor query performance
- Use database connection pooling

### Error Handling
- Never expose sensitive data in errors
- Log errors for debugging
- Return consistent error formats
- Handle async errors properly

## Deployment Checklist

- [ ] Set production environment variables
- [ ] Configure production database
- [ ] Set up SSL/TLS
- [ ] Configure CORS for your frontend
- [ ] Set up logging aggregation
- [ ] Configure monitoring and alerts
- [ ] Test all endpoints
- [ ] Update default passwords
- [ ] Review security headers

## Need Help?

The template is designed to be:
- **Scalable**: Add features as you grow
- **Secure**: Following security best practices  
- **Maintainable**: Clean, documented code
- **Flexible**: Use what you need, remove what you don't

Remember: This template gives you a solid foundation. Build your amazing project on top of it! 🎉
