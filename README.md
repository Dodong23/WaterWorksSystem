# WWorks Backend (Manukan Waterworks)

Quick notes to run the backend locally.

Prerequisites
- Node.js 18+ / npm
- MongoDB (connection URI)

Setup

1. Copy environment template:

```powershell
copy .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Start the server (development):

```bash
npm run dev
```

4. Production start:

```bash
npm start
```

Environment variables
- `MONGODB_URI` - MongoDB connection string
- `PORT` - server port (defaults to 7000)
- `CLOUDINARY_*` - optional cloudinary config
- `JWT_SECRET` - Secret key for JWT authentication.
- `ADMIN_USER_NAME` - Username for the default master administrator.
- `ADMIN_PASSWORD` - Password for the default master administrator.

## Features

### Admin User Management

An administrative interface (UI) is available for managing system users, accessible only by the master administrator.

-   **User CRUD Operations**: Master admins can add, edit, and delete user accounts.
-   **User Status Monitoring**: The UI displays whether users are currently logged in or logged out.
-   **Secure Access**: Access to user management features is protected by JWT authentication and role-based authorization, ensuring only the designated master admin can perform these actions.

### Master Admin Setup

Upon application startup, the system checks for the existence of a master administrator. If one is not found, a default master admin user is created using the `ADMIN_USER_NAME` and `ADMIN_PASSWORD` defined in the `.env` file. This ensures that a master admin is always available to manage the system.

Notes
- The `Payment` model uses `allocation` as the canonical field; legacy code may use `allocations` (a virtual is exposed for compatibility).
- API responses are standardized via `helpers/apiResponse.js`.
