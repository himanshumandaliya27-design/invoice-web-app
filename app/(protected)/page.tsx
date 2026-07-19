import { prisma } from '@/lib/prisma'
import { getActiveCompanyId } from '@/app/actions/company'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const companyId = await getActiveCompanyId()

  if (!companyId) {
    return (
      <main className="flex-1 p-lg lg:p-xl max-w-container-max mx-auto w-full flex flex-col items-center justify-center text-center space-y-md min-h-[60vh]">
        <div className="bg-primary-container text-on-primary-container p-xl rounded-full mb-md shadow-lg border-4 border-primary">
          <span className="material-symbols-outlined text-[64px]">storefront</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-primary font-['Aclonica']">Welcome to Invoice App</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">Get started by creating your company profile to manage customers, items, and invoices.</p>
        <Link href="/company" className="px-xl py-md bg-primary text-on-primary font-label-lg text-label-lg rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-md mt-sm flex items-center gap-sm">
          <span className="material-symbols-outlined">add_business</span>
          Set Up Company Now
        </Link>
      </main>
    )
  }

  // Fetch dashboard stats
  const [invoices, customersCount, itemsCount] = await Promise.all([
    prisma.invoice.findMany({ where: { company_id: companyId }, include: { customer: true }, orderBy: { date: 'desc' } }),
    prisma.customer.count({ where: { company_id: companyId } }),
    prisma.item.count({ where: { company_id: companyId } })
  ])

  const now = new Date()
  
  // Calculate Totals and Statuses
  let totalBilled = 0
  let totalPaid = 0
  let totalOutstanding = 0
  let overdueCount = 0

  invoices.forEach(i => {
    totalBilled += i.grand_total
    if (i.status === 'PAID') {
      totalPaid += i.grand_total
    } else if (i.status !== 'CANCELLED') {
      totalOutstanding += i.grand_total
    }

    if (i.status !== 'PAID' && i.status !== 'CANCELLED' && i.due_date && new Date(i.due_date) < now) {
      overdueCount++
    }
  })

  const recentInvoices = invoices.slice(0, 5).map(i => {
    let currentStatus = i.status
    if (currentStatus !== 'PAID' && currentStatus !== 'CANCELLED' && i.due_date && new Date(i.due_date) < now) {
      currentStatus = 'OVERDUE'
    }
    return { ...i, displayStatus: currentStatus }
  })

  return (
    <main className="flex-1 p-lg lg:p-xl max-w-container-max mx-auto w-full space-y-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg md:font-headline-lg md:text-headline-lg font-headline-lg-mobile text-headline-lg-mobile text-primary font-['Aclonica']">Dashboard</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Overview of your billing and business.</p>
        </div>
        <div className="flex gap-sm w-full sm:w-auto">
          <Link href="/invoices/new" className="w-full sm:w-auto px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container transition-colors flex items-center justify-center gap-xs shadow-md">
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            New Invoice
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        {/* Total Billed */}
        <div className="bg-surface border border-outline-variant p-lg rounded-xl shadow-sm relative overflow-hidden flex flex-col items-center text-center justify-center h-32 hover:bg-surface-container-low transition-colors group">
          <div className="absolute top-0 w-full h-1 bg-primary"></div>
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">Total Billed</p>
          <p className="font-headline-lg text-headline-lg text-primary font-bold">₹{totalBilled.toLocaleString('en-IN', {minimumFractionDigits: 0})}</p>
        </div>

        {/* Total Outstanding */}
        <div className="bg-surface border border-outline-variant p-lg rounded-xl shadow-sm relative overflow-hidden flex flex-col items-center text-center justify-center h-32 hover:bg-surface-container-low transition-colors group">
          <div className="absolute top-0 w-full h-1 bg-secondary"></div>
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">Total Outstanding</p>
          <p className="font-headline-lg text-headline-lg text-secondary font-bold">₹{totalOutstanding.toLocaleString('en-IN', {minimumFractionDigits: 0})}</p>
        </div>

        {/* Paid */}
        <div className="bg-surface border border-outline-variant p-lg rounded-xl shadow-sm relative overflow-hidden flex flex-col items-center text-center justify-center h-32 hover:bg-surface-container-low transition-colors group">
          <div className="absolute top-0 w-full h-1 bg-[#10b981]"></div>
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">Total Received</p>
          <p className="font-headline-lg text-headline-lg text-[#10b981] font-bold">₹{totalPaid.toLocaleString('en-IN', {minimumFractionDigits: 0})}</p>
        </div>

        {/* Overdue */}
        <div className="bg-surface border border-outline-variant p-lg rounded-xl shadow-sm relative overflow-hidden flex flex-col items-center text-center justify-center h-32 hover:bg-error-container transition-colors group">
          <div className="absolute top-0 w-full h-1 bg-error"></div>
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs group-hover:text-error">Overdue Invoices</p>
          <p className="font-headline-lg text-headline-lg text-error font-bold">{overdueCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Quick Stats */}
        <div className="bg-surface border border-outline-variant p-lg rounded-xl shadow-sm space-y-md">
          <h3 className="font-headline-sm text-headline-sm text-primary font-['Aclonica'] border-b border-outline-variant pb-xs">Database Stats</h3>
          <div className="flex justify-between items-center py-2 border-b border-outline-variant/30">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined">receipt_long</span>
              <span>Total Invoices</span>
            </div>
            <span className="font-bold text-lg">{invoices.length}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-outline-variant/30">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined">groups</span>
              <span>Total Customers</span>
            </div>
            <span className="font-bold text-lg">{customersCount}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined">inventory_2</span>
              <span>Total Items</span>
            </div>
            <span className="font-bold text-lg">{itemsCount}</span>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="lg:col-span-2 bg-surface border border-outline-variant rounded-xl shadow-sm flex flex-col">
          <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-bright">
            <h3 className="font-headline-sm text-headline-sm text-primary font-['Aclonica']">Recent Invoices</h3>
            <Link href="/invoices" className="text-sm text-primary hover:underline font-medium">View All</Link>
          </div>
          <div className="overflow-x-auto flex-1 p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="py-2 px-4 font-semibold text-sm text-on-surface-variant">Invoice</th>
                  <th className="py-2 px-4 font-semibold text-sm text-on-surface-variant">Customer</th>
                  <th className="py-2 px-4 font-semibold text-sm text-on-surface-variant">Amount</th>
                  <th className="py-2 px-4 font-semibold text-sm text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {recentInvoices.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-on-surface-variant">No invoices generated yet.</td></tr>
                ) : (
                  recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-4 font-medium text-primary">{inv.invoice_number}</td>
                      <td className="py-3 px-4 truncate max-w-[150px]">{inv.customer.name}</td>
                      <td className="py-3 px-4 font-medium">₹{inv.grand_total.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
                      <td className="py-3 px-4">
                        {inv.displayStatus === 'DRAFT' && <span className="bg-surface-variant px-2 py-1 rounded text-xs font-bold">DRAFT</span>}
                        {inv.displayStatus === 'SENT' && <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded text-xs font-bold">SENT</span>}
                        {inv.displayStatus === 'PAID' && <span className="bg-primary-container text-on-primary-container px-2 py-1 rounded text-xs font-bold">PAID</span>}
                        {inv.displayStatus === 'OVERDUE' && <span className="bg-error-container text-error px-2 py-1 rounded text-xs font-bold">OVERDUE</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
