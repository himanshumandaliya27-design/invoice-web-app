'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Sidebar() {
  const pathname = usePathname()

  const links = [
    { name: 'Dashboard', href: '/', icon: 'dashboard' },
    { name: 'Invoices', href: '/invoices', icon: 'description' },
    { name: 'Customers', href: '/customers', icon: 'group' },
    { name: 'Products', href: '/products', icon: 'inventory_2' },
    { name: 'Settings', href: '/settings', icon: 'settings' },
  ]

  return (
    <nav className="hidden md:flex flex-col h-screen fixed left-0 top-0 w-64 bg-surface border-r border-outline-variant transition-colors duration-200 z-50">
      <div className="p-lg flex items-center gap-sm">
        <img className="h-8 w-8 rounded object-cover" alt="Logo" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTCfv0Ygg8dVlAmZKLl1RldTMGBsW49-hO1g4UDu9TJlnMcsbb5PARBItQv1CGrmEyAtuObR93T4RDv6AcptF6MjPONmlHk9J9J_V7sE0auGUDSOjksb-cTwWD0Ra4h2ZEA-RBD2pC2g98TZwbfLRmdT8MF67YljGMR8Eck8PdeKTuK_Ew_ZX27muNlB9HU_yWOdvon3g6qfUWHl_Cf3YbUR-r9Cw4TeJh8M8Kv03caqFNkndIWHAkSoUziva33PSBGkqGYuyM9nCU" />
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">FinTrust Billing</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">GST Compliant</p>
        </div>
      </div>
      
      <ul className="flex-1 mt-md px-sm space-y-xs">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`) && link.href !== '/'

          return (
            <li key={link.href}>
              <Link 
                href={link.href} 
                className={`flex items-center gap-md px-md py-sm rounded-lg transition-colors duration-200 ${
                  isActive 
                    ? 'bg-surface-container text-primary font-bold border-r-4 border-primary' 
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                <span className="font-label-md text-label-md">{link.name}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
