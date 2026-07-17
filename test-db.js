const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.siwceqvuesostdxgvwsd:Himanshu%40123@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
});
prisma.invoice.count().then(c => console.log('Count:', c)).catch(e => console.error(e)).finally(() => prisma.$disconnect());
