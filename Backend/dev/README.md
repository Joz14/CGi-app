# Development Tools & Environment

This directory contains tools and utilities specifically for development purposes.

## DEV Mode

You can run the application in DEV mode by setting the `DEV_MODE=true` environment variable in your `.env` file. 

When running in DEV mode:

1. Authentication is bypassed, with a dummy admin user added to all requests
2. A development database is used (`MONGO_URI_DEV` or default URI with `-dev` suffix)
3. The database is automatically seeded with mock data on startup

## Database Seeding

The seeder creates:
- 100 fake users
- 20 clans (5 users per clan)
- 2 leagues with 10 groups
- The clans are assigned evenly across leagues and groups
- Sample matches between clans

### Running the seeder

To seed the development database manually:

```bash
# Option 1: Runs the seeder script directly
npm run dev:seed

# Option 2: Start the server in DEV mode to automatically seed
DEV_MODE=true npm run dev
```

## Environment Variables

Add these to your `.env` file:

```
# Development Mode
DEV_MODE=true

# Development Database (optional, will default to MONGO_URI with -dev suffix)
MONGO_URI_DEV=mongodb://localhost:27017/cgi-dev
```

## Dummy User

When in DEV mode, all requests are automatically authenticated with the following user:

```javascript
{
  _id: 'dev-user-id-1',
  name: 'Dev User',
  role: 'admin',
  clanId: 'dev-clan-id'
}
``` 