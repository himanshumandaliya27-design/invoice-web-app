This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## Production Checklist & Architecture Notes

### Security & Out-of-Scope Features
> [!IMPORTANT]
> **Payment tracking and reconciliation are intentionally out of scope.** The `paid_amount` and `balance_amount` fields in the schema are ignored by the backend APIs. Do not implement payment workflows in this purely generation-oriented service.

### Environment & Deployment
1. **DATABASE_URL**: Must point to a production-grade SQL database (e.g., PostgreSQL or Turso) rather than local SQLite `dev.db`.
2. **Authentication**: This app has NO built-in auth. For production, you MUST place this behind an auth proxy, VPN, or implement NextAuth/Clerk. Otherwise, sensitive Company Bank details and Customer information will be exposed.
3. **Database Migrations**: Before deploying, run `npx prisma migrate deploy` to apply schema changes (like the newly added `@@index` performance optimizations) to your production database.
4. **Rate Limiting**: Not natively handled by Next.js. Implement rate limiting on `/api/invoices/[id]/pdf` via Vercel Edge Middleware or an API Gateway, as PDF generation via Puppeteer is resource-intensive.
5. **Backups**: Ensure your database provider has automated daily backups for invoice records.
