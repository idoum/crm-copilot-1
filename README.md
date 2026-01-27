# CRM Copilot

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Application URL (used for emails, links)
APP_URL="http://localhost:3000"

# SMTP Configuration (for password reset emails)
SMTP_HOST="smtp.gmail.com"           # Your SMTP server
SMTP_PORT="587"                       # 587 for TLS, 465 for SSL
SMTP_SECURE="false"                   # "true" for port 465, "false" for 587
SMTP_USER="your-email@gmail.com"      # SMTP username
SMTP_PASS="your-app-password"         # SMTP password (use App Password for Gmail)
SMTP_FROM="your-email@gmail.com"      # From email address
```

### Gmail SMTP Setup

To use Gmail for sending emails:

1. Enable 2-Step Verification in your Google Account
2. Go to Google Account → Security → App passwords
3. Generate a new app password for "Mail"
4. Use that 16-character password as `SMTP_PASS`

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Production Deployment

### Required Environment Variables

All these variables **must** be set in production (no defaults):

| Variable | Description |
|----------|-------------|
| `AUTH_SECRET` | Secret for signing JWTs. Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Full URL of your app (e.g., `https://crm.example.com`) |
| `APP_URL` | Same as NEXTAUTH_URL, used for email links |
| `DATABASE_URL` | Database connection string |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (587 for TLS, 465 for SSL) |
| `SMTP_SECURE` | `true` for port 465, `false` for 587 |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | From email address |

### Optional Tunables

| Variable | Default | Description |
|----------|---------|-------------|
| `INVITE_EXPIRY_DAYS` | 7 | Days before invite link expires |
| `PASSWORD_RESET_EXPIRY_MINUTES` | 30 | Minutes before reset link expires |
| `RESET_RATE_LIMIT_WINDOW_MINUTES` | 15 | Rate limit window for reset requests |
| `RESET_RATE_LIMIT_MAX` | 5 | Max reset requests per window |
| `CHANGE_PWD_RATE_LIMIT_WINDOW_MINUTES` | 10 | Rate limit window for password changes |
| `CHANGE_PWD_RATE_LIMIT_MAX` | 5 | Max password change attempts per window |
| `BCRYPT_ROUNDS` | 10 | Bcrypt hashing rounds (10-12 recommended) |
| `WORKSPACE_COOKIE_MAX_AGE_DAYS` | 365 | Workspace cookie lifetime |

### Production Checklist

```bash
# 1. Install dependencies
pnpm install

# 2. Generate Prisma client
pnpm prisma generate

# 3. Run database migrations
pnpm prisma migrate deploy

# 4. Build the application
pnpm build

# 5. Start production server
pnpm start
```

### Security Notes

- **Passwords**: All passwords are hashed with bcrypt. Plaintext passwords are never accepted.
- **Cookies**: The `current-workspace` cookie has `secure: true` in production (HTTPS only).
- **Seed**: Database seed is disabled in production by default. Set `ALLOW_SEED=true` to override.
- **Rate limiting**: Password reset and change operations are rate-limited.
- **Anti-enumeration**: Password reset always returns success to prevent email enumeration.
