import { getCustomers } from '@/app/actions/customers';
import CustomersClient from './CustomersClient';

export default async function CustomersPage() {
    const customers = await getCustomers();
    return (
        <CustomersClient
            initialCustomers={customers.map((c) => ({
                ...c,
                isRegular: c.isRegular,
                discountRate: Number(c.discountRate),
            }))}
        />
    );
}
