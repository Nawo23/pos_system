'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

import { serializePrisma } from '@/lib/serializePrisma';

export async function getCustomers() {
    const customers = await prisma.customer.findMany({
        include: { _count: { select: { sales: true } } },
        orderBy: { name: 'asc' },
    });
    return serializePrisma(customers);
}

export async function createCustomer(data: { name: string; phone?: string; isRegular?: boolean; discountRate?: number }) {
    await prisma.customer.create({ data });
    revalidatePath('/customers');
}

export async function updateCustomer(id: string, data: { name?: string; phone?: string; isRegular?: boolean; discountRate?: number }) {
    await prisma.customer.update({ where: { id }, data });
    revalidatePath('/customers');
}

export async function deleteCustomer(id: string) {
    await prisma.customer.delete({ where: { id } });
    revalidatePath('/customers');
}

export async function getCustomerHistory(customerId: string) {
    const history = await prisma.sale.findMany({
        where: { customerId },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
    });
    return serializePrisma(history);
}

export async function searchCustomers(query: string) {
    const customers = await prisma.customer.findMany({
        where: {
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query } },
            ],
        },
        take: 10,
    });
    return serializePrisma(customers);
}

export async function getCustomerByPhone(phone: string) {
    if (!phone) return null;
    const customer = await prisma.customer.findFirst({ where: { phone } });
    return serializePrisma(customer);
}

export async function quickAddCustomer(name: string, phone: string) {
    const customer = await prisma.customer.create({ data: { name, phone } });
    return serializePrisma(customer);
}