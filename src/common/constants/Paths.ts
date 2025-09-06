export default {
    Base: '/api',
    Auth: {
        Base: '/auth',
        Login: '/login',
        Register: '/register',
        Refresh: '/refresh',
        Logout: '/logout',
        ChangePassword: '/change-password',
        Me: '/me',
        Verify: '/verify'
    },
    Users: {
        Base: '/users',
        GetAll: '/',
        GetById: '/:id',
        Create: '',
        Update: '/:id',
        Delete: '/:id',
        GetRoles: '/:id/roles',
        AssignRole: '/:id/roles/:roleId',
        RemoveRole: '/:id/roles/:roleId'
    },
    Roles: {
        Base: '/roles',
        GetAll: '/',
        GetById: '/:id',
        Create: '',
        Update: '/:id',
        Delete: '/:id'
    }
} as const;
