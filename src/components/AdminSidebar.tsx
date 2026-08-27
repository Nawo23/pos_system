'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
    LayoutDashboard, ShoppingCart, Package, ClipboardList,
    FileText, Bell, Users, Truck, BarChart3, LogOut,
    ChevronLeft, ChevronRight, ChevronDown, ArrowLeftRight, Wrench,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type NavItem = { label: string; href: string; icon: any };
type NavGroup = { label: string; icon: any; items: NavItem[] };

const GROUPS: NavGroup[] = [
    {
        label: 'Operations',
        icon: Wrench,
        items: [
            { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
            { label: 'POS', href: '/admin/pos', icon: ShoppingCart },
            { label: 'Invoices', href: '/admin/invoices', icon: FileText },
            { label: 'Alerts', href: '/admin/alerts', icon: Bell },
        ],
    },
    {
        label: 'Inventory',
        icon: Package,
        items: [
            { label: 'Products', href: '/admin/products', icon: Package },
            { label: 'Inventory', href: '/admin/inventory', icon: ClipboardList },
            { label: 'GRN', href: '/admin/grn', icon: Truck },
            { label: 'Transactions', href: '/admin/transactions', icon: ArrowLeftRight },
        ],
    },
];

const STANDALONE: NavItem[] = [
    { label: 'Customers', href: '/admin/customers', icon: Users },
    { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
];

export default function AdminSidebar({ shopName = 'Auto & Electric Parts' }: { shopName?: string }) {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Operations: true, Inventory: true });

    function toggleGroup(label: string) {
        setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
    }

    async function handleLogout() {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    }

    function isActive(href: string) {
        if (!pathname) return false;
        return pathname === href || pathname.startsWith(href + '/');
    }

    return (
        <aside className={`sticky top-0 h-screen flex-shrink-0 flex flex-col bg-neutral-950 border-r border-neutral-800 transition-all z-40 ${collapsed ? 'w-20' : 'w-64'}`}>
            <div className="flex items-center gap-3 border-b border-neutral-800 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded bg-yellow-500 font-bold text-black flex-shrink-0">
                    {shopName.charAt(0)}
                </div>
                {!collapsed && (
                    <div className="min-w-0 overflow-hidden">
                        <p className="text-sm font-semibold text-white truncate">{shopName}</p>
                        <p className="text-[10px] uppercase tracking-wide text-neutral-500">Admin Portal</p>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    className="ml-auto rounded p-1 text-neutral-500 hover:bg-neutral-800 flex-shrink-0"
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            <nav className="flex-1 space-y-4 overflow-y-auto p-3">
                {GROUPS.map((group) => (
                    <div key={group.label}>
                        <button
                            onClick={() => toggleGroup(group.label)}
                            title={group.label}
                            className="flex w-full items-center gap-2 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 hover:text-neutral-300"
                        >
                            <group.icon size={14} className="flex-shrink-0" />
                            {!collapsed && (
                                <>
                                    <span className="truncate">{group.label}</span>
                                    <ChevronDown size={14} className={`ml-auto flex-shrink-0 transition-transform ${openGroups[group.label] ? '' : '-rotate-90'}`} />
                                </>
                            )}
                        </button>

                        {(collapsed || openGroups[group.label]) && (
                            <div className="mt-1 space-y-1">
                                {group.items.map(({ label, href, icon: Icon }) => {
                                    const active = isActive(href);
                                    return (
                                        <Link
                                            key={href}
                                            href={href}
                                            title={label}
                                            className={`flex items-center gap-3 rounded px-3 py-2 text-sm transition ${active ? 'bg-yellow-500 text-black font-medium' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                                                }`}
                                        >
                                            <Icon size={18} className="flex-shrink-0" />
                                            {!collapsed && <span className="truncate">{label}</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}

                <div className="border-t border-neutral-800 pt-3 space-y-1">
                    {STANDALONE.map(({ label, href, icon: Icon }) => {
                        const active = isActive(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                title={label}
                                className={`flex items-center gap-3 rounded px-3 py-2 text-sm transition ${active ? 'bg-yellow-500 text-black font-medium' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                                    }`}
                            >
                                <Icon size={18} className="flex-shrink-0" />
                                {!collapsed && <span className="truncate">{label}</span>}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <div className="border-t border-neutral-800 p-3">
                <button
                    onClick={handleLogout}
                    title="Log Out"
                    className="flex w-full items-center gap-3 rounded px-3 py-2 text-sm text-red-400 hover:bg-red-950"
                >
                    <LogOut size={18} className="flex-shrink-0" />
                    {!collapsed && 'Log Out'}
                </button>
            </div>
        </aside>
    );
}