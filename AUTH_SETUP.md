# Authentication System Setup

## Overview
The authentication system has been fixed to work with Express sessions. The system uses:
- Backend: Express.js with express-session
- Frontend: Astro with client-side JavaScript
- Session storage: In-memory (for development)
- Password hashing: bcrypt

## Changes Made

### Backend (server/app.js)
1. Fixed session cookie configuration:
   - Changed `sameSite` from "none" to "lax" for localhost compatibility
   - Added `maxAge` of 24 hours
   - Added fallback `SECRET_KEY` for development

2. Fixed `/api/profile` endpoint:
   - Changed from `/profile` to `/api/profile` to match API_URL
   - Changed status code from 404 to 401 for unauthorized access

### Frontend (client/src/pages/auth/)
1. **login.astro**: Uses client-side fetch to POST to `/api/login`
2. **register.astro**: Uses client-side fetch to POST to `/api/register`
3. **logout.astro**: Calls `/api/logout` and redirects to home
4. **profile/index.astro**: Fetches user data from `/api/profile`

### Build Configuration
- Added `@astrojs/node` adapter for server-side rendering
- Changed Astro config from `output: 'static'` to `output: 'server'`
- Disabled prerendering for index page to avoid build-time API calls

## Setup Instructions

### 1. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Set Up Database
Create a PostgreSQL database named `movies` and run the migrations:
```bash
cd server
npm run migrate
```

### 3. Configure Environment Variables
Create a `.env` file in the `server` directory:
```
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=movies
SECRET_KEY=your-secret-key-here
MONGODB_URI=mongodb://localhost:27017
DEBUG=true
API_MODE=true
```

### 4. Run the Application
Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```
This starts the API server on http://localhost:3500

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
This starts the Astro dev server on http://localhost:4321

## Testing Authentication

### 1. Register a New User
- Navigate to http://localhost:4321/auth/register
- Fill in username, email, and password
- Submit the form
- You should be redirected to the home page

### 2. Login
- Navigate to http://localhost:4321/auth/login
- Enter your email and password
- Submit the form
- You should be redirected to the home page

### 3. View Profile
- Click on your username in the navbar (if logged in)
- Select "Perfil" from the dropdown
- You should see your username and email

### 4. Logout
- Click on your username in the navbar
- Select "Cerrar sesión"
- You should be logged out and redirected to home

## API Endpoints

### POST /api/register
Register a new user
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

### POST /api/login
Login with existing credentials
```json
{
  "email": "string",
  "password": "string"
}
```

### POST /api/logout
Logout the current user (requires authentication)

### GET /api/profile
Get the current user's profile (requires authentication)

## Troubleshooting

### Session not persisting
- Make sure cookies are enabled in your browser
- Check that both frontend and backend are running on localhost
- Verify that CORS is configured correctly (should allow `http://localhost:4321`)

### Can't connect to database
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Run migrations to create necessary tables

### Build errors
- Make sure all dependencies are installed
- Check that `@astrojs/node` adapter is installed
- Verify Node.js version is compatible (v18 or later)

## Security Notes

**For Development Only:**
- Session secret is set to a default value if not provided
- Sessions are stored in memory (will be lost on server restart)
- No rate limiting on auth endpoints

**For Production:**
- Use a strong, random SECRET_KEY
- Use a session store (Redis, MongoDB, etc.)
- Enable HTTPS and set `cookie.secure: true`
- Add rate limiting to prevent brute force attacks
- Use environment-specific CORS configuration
