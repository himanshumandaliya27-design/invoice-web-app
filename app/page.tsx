import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const [invoices, totalOutstanding, totalDrafts] = await Promise.all([
    prisma.invoice.findMany({
      include: { customer: true },
      orderBy: { created_at: 'desc' },
      take: 5
    }),
    prisma.invoice.aggregate({
      where: { status: 'SENT' }, // Treating sent as outstanding
      _sum: { grand_total: true }
    }),
    prisma.invoice.aggregate({
      where: { status: 'DRAFT' },
      _sum: { grand_total: true }
    })
  ])

  const draftsCount = await prisma.invoice.count({ where: { status: 'DRAFT' } })
  const overdueCount = await prisma.invoice.count({ where: { status: 'SENT' } }) // Using sent as overdue for demo

  const outstandingTotal = totalOutstanding._sum.grand_total || 0
  const draftsTotal = totalDrafts._sum.grand_total || 0

  return (
    <main className="flex-1 p-lg lg:p-xl max-w-container-max mx-auto w-full space-y-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg md:font-headline-lg md:text-headline-lg font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Invoices</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Manage and track your billing documents.</p>
        </div>
        <Link href="/invoices/new" className="lg:hidden w-full sm:w-auto px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container transition-colors flex items-center justify-center gap-xs">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Create New
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {/* Total Outstanding */}
        <div className="bg-surface border border-outline-variant rounded-xl p-lg flex flex-col justify-between h-32 hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase">Total Outstanding</span>
            <span className="material-symbols-outlined text-[#872d00] bg-[#872d00]/10 p-xs rounded-full text-[20px]">payments</span>
          </div>
          <div>
            <div className="font-headline-lg text-headline-lg text-on-surface">₹{outstandingTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div className="font-body-sm text-body-sm text-on-surface-variant mt-xs flex items-center gap-xs">
              <span className="text-error font-medium flex items-center"><span className="material-symbols-outlined text-[14px]">arrow_upward</span> 12%</span> vs last month
            </div>
          </div>
        </div>

        {/* Drafts */}
        <div className="bg-surface border border-outline-variant rounded-xl p-lg flex flex-col justify-between h-32 hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase">Drafts</span>
            <span className="material-symbols-outlined text-outline bg-surface-variant p-xs rounded-full text-[20px]">draft</span>
          </div>
          <div className="flex items-end justify-between w-full">
            <div className="font-headline-lg text-headline-lg text-on-surface">{draftsCount}</div>
            <div className="font-body-sm text-body-sm text-on-surface-variant mb-1">₹{draftsTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })} pending</div>
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-error-container border border-error/20 rounded-xl p-lg flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="font-label-md text-label-md text-on-error-container uppercase">Overdue</span>
            <span className="material-symbols-outlined text-error bg-error/10 p-xs rounded-full text-[20px]">warning</span>
          </div>
          <div>
            <div className="font-headline-lg text-headline-lg text-on-error-container">{overdueCount}</div>
            <div className="font-body-sm text-body-sm text-on-error-container/80 mt-xs font-medium">Requires immediate action</div>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table Area */}
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col">
        <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <h3 className="font-headline-md text-headline-md text-on-surface">Recent Invoices</h3>
          <Link href="/invoices" className="text-primary font-label-md text-label-md hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-bright border-b border-outline-variant">
                <th className="font-label-md text-label-md text-on-surface-variant uppercase py-md px-lg font-semibold w-1/4">Invoice Number</th>
                <th className="font-label-md text-label-md text-on-surface-variant uppercase py-md px-lg font-semibold w-1/4">Customer Name</th>
                <th className="font-label-md text-label-md text-on-surface-variant uppercase py-md px-lg font-semibold w-[15%]">Date</th>
                <th className="font-label-md text-label-md text-on-surface-variant uppercase py-md px-lg font-semibold text-right w-[15%]">Grand Total</th>
                <th className="font-label-md text-label-md text-on-surface-variant uppercase py-md px-lg font-semibold text-center w-[15%]">Status</th>
              </tr>
            </thead>
            <tbody className="font-table-data text-table-data text-on-surface divide-y divide-outline-variant">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-surface-container-low transition-colors group cursor-pointer">
                  <td className="py-md px-lg font-medium text-primary">
                    <Link href={`/invoices/${inv.id}`}>{inv.invoice_number}</Link>
                  </td>
                  <td className="py-md px-lg">{inv.customer.name}</td>
                  <td className="py-md px-lg text-on-surface-variant">{new Date(inv.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="py-md px-lg text-right font-medium">₹{inv.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-md px-lg text-center">
                    {inv.status === 'SENT' ? (
                       <span className="inline-block px-sm py-xs bg-surface-container-highest text-primary-container font-label-md text-label-md rounded uppercase text-[10px] tracking-wider">Sent</span>
                    ) : inv.status === 'DRAFT' ? (
                       <span className="inline-block px-sm py-xs bg-surface-variant text-on-surface-variant font-label-md text-label-md rounded uppercase text-[10px] tracking-wider">Draft</span>
                    ) : (
                       <span className="inline-block px-sm py-xs bg-[#e6f4ea] text-[#137333] font-label-md text-label-md rounded uppercase text-[10px] tracking-wider">Paid</span>
                    )}
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-xl text-center text-on-surface-variant">No invoices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
