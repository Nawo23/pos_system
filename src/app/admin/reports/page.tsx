import { getPeriodReport } from '@/app/actions/reports';
import ReportsClient from './ReportsClient';

export default async function ReportsPage() {
    const initial = await getPeriodReport('daily');
    return <ReportsClient initialReport={initial} />;
}