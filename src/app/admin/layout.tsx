import { getCurrentUser } from '@/lib/getCurrentUser';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const user = await getCurrentUser();
    if (!user) redirect('/login');

    return (
        <div className="flex min-h-screen bg-neutral-950">
            <AdminSidebar />
            <main className="flex-1 min-w-0">{children}</main>
        </div>
    );
}