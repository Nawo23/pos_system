'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

import { serializePrisma } from '@/lib/serializePrisma';

export async function getGrns() {
    const grns = await prisma.grn.findMany({
        include: { supplier: true, items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
    });
    return serializePrisma(grns);
}

export async function getSuppliers() {
    const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } });
    return serializePrisma(suppliers);
}

export async function createSupplier(data: { name: string; phone?: string; address?: string }) {
    const supplier = await prisma.supplier.create({ data });
    revalidatePath('/admin/grn');
    return serializePrisma(supplier);
}

type GrnItemInput = { productId: string; qty: number; unitCost: number };

export async function createGrn(supplierId: string, items: GrnItemInput[], note?: string) {
    if (items.length === 0) throw new Error('Add at least one item');
    const grnNo = `GRN-${Date.now()}`;

    const grn = await prisma.$transaction(async (tx) => {
        const grn = await tx.grn.create({
            data: {
                grnNo, supplierId, note,
                items: { create: items.map((i) => ({ productId: i.productId, qty: i.qty, unitCost: i.unitCost })) },
            },
            include: { items: true },
        });

        for (const item of items) {
            await tx.product.update({
                where: { id: item.productId },
                data: { stockQty: { increment: item.qty }, costPrice: item.unitCost },
            });
            await tx.stockMovement.create({
                data: { productId: item.productId, type: 'STOCK_IN', qtyChange: item.qty, supplierId, note: grnNo },
            });
        }

        return grn;
    });

    revalidatePath('/admin/grn');
    revalidatePath('/admin/inventory');
    return serializePrisma(grn);
}