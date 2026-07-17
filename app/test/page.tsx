import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function TestPage() {
  try {
    const count = await prisma.invoice.count()
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: 'green' }}>Database Connected Successfully!</h1>
        <p>Total Invoices: {count}</p>
      </div>
    )
  } catch (error: any) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: 'red' }}>Database Connection Failed</h1>
        <pre style={{ background: '#f4f4f4', padding: '1rem', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
          {error.message || String(error)}
        </pre>
        <h3>Stack Trace:</h3>
        <pre style={{ background: '#f4f4f4', padding: '1rem', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
          {error.stack}
        </pre>
      </div>
    )
  }
}
