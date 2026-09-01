import { getDashboardReport, getDashboardFilterOptions } from '@/app/actions/dashboard';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
    const today = new Date();
    const from = new Date(today); from.setHours(0, 0, 0, 0);
    const to = new Date(today); to.setHours(23, 59, 59, 999);

    const [report, filterOptions] = await Promise.all([
        getDashboardReport(from.toISOString(), to.toISOString()),
        getDashboardFilterOptions(),
    ]);

    return <DashboardClient initialReport={report} filterOptions={filterOptions} />;
}