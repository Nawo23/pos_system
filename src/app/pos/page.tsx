import { getCurrentUser } from '@/lib/getCurrentUser';
import { redirect } from 'next/navigation';
import PosClient from './PosClient';

export default async function PosPage() {
    const user = await getCurrentUser();
    if (!user) redirect('/login');
    return <PosClient />;
}
