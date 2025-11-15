# Lock-In Responsible - Backend

Backend API service for the Lock-In Responsible system.

## Features

- RESTful API with Express + TypeScript
- JWT authentication with refresh tokens
- PostgreSQL database with Prisma ORM
- LLM integration (OpenAI GPT-4 / Anthropic Claude)
- Goal tracking and verification
- Rate limiting and security features

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or SQLite for development)
- OpenAI or Anthropic API key

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

The API will be available at `http://localhost:3000/api`

## Environment Variables

See `.env.example` for all available configuration options. Key variables:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT signing
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`: LLM provider API key

## Database

### SQLite (Development)

```bash
# In .env
DATABASE_URL="file:./dev.db"

# Push schema
npm run db:push
```

### PostgreSQL (Production)

```bash
# In .env
DATABASE_URL="postgresql://user:password@localhost:5432/lockin?schema=public"

# Run migrations
npm run db:migrate
```

### Prisma Commands

```bash
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:push      # Push schema (development)
npm run db:studio    # Open Prisma Studio GUI
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues

## API Documentation

Full API documentation is available in [`/docs/API.md`](../docs/API.md)

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

#### Users
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update profile

#### Goals
- `GET /api/goals` - List goals
- `POST /api/goals` - Create goal
- `POST /api/goals/:id/verify` - Submit proof for verification

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utilities
│   ├── app.ts           # Express app
│   └── index.ts         # Entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── .env.example         # Environment variables template
├── package.json
└── tsconfig.json
```

## Development

### Adding a New Endpoint

1. Create/update controller in `src/controllers/`
2. Create/update route in `src/routes/`
3. Register route in `src/app.ts`
4. Update API documentation

### Adding LLM Provider

See `src/services/llm.service.ts` to add support for additional LLM providers.

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Deployment

### Docker

```dockerfile
# Dockerfile example
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Environment

- Set `NODE_ENV=production`
- Use PostgreSQL (not SQLite)
- Set strong JWT secrets
- Configure proper CORS origins
- Enable HTTPS
- Use environment variables for all secrets

## Security

- All passwords hashed with bcrypt
- JWT tokens with short expiry (15 min access, 7 day refresh)
- Rate limiting on all endpoints
- Helmet.js security headers
- Input validation with Zod
- SQL injection protection via Prisma

## Troubleshooting

### Database Connection Error

```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
npm run db:studio
```

### Port Already in Use

```bash
# Change PORT in .env
PORT=3001
```

### Prisma Client Errors

```bash
# Regenerate Prisma client
npm run db:generate
```

## License

MIT
