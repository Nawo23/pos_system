'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

function generateBarcodeValue() {
    const ts = Date.now().toString().slice(-10);
    const rand = Math.floor(100 + Math.random() * 900);
    return `${ts}${rand}`;
}

export async function getProducts() {
    return prisma.product.findMany({
        include: { category: true },
        orderBy: { name: 'asc' },
    });
}

export async function getProductByBarcode(barcode: string) {
    return prisma.product.findUnique({ where: { barcode } });
}

export async function createProduct(data: {
    sku: string; name: string; brand?: string; categoryId: string;
    unit: string; costPrice: number; sellPrice: number; stockQty: number; lowStockAt: number;
    barcode?: string; imageUrl?: string;
}) {
    const barcode = data.barcode?.trim() || generateBarcodeValue();
    const product = await prisma.product.create({ data: { ...data, barcode } });
    revalidatePath('/admin/products');
    return product;
}

export async function updateProduct(id: string, data: Partial<{
    sku: string; name: string; brand: string; categoryId: string;
    unit: string; costPrice: number; sellPrice: number; lowStockAt: number; barcode: string; imageUrl: string; inStock: boolean;
}>) {
    await prisma.product.update({ where: { id }, data: data as any });
    revalidatePath('/admin/products');
}

export async function deleteProduct(id: string) {
    await prisma.product.delete({ where: { id } });
    revalidatePath('/admin/products');
}

export async function regenerateBarcode(id: string) {
    const barcode = generateBarcodeValue();
    await prisma.product.update({ where: { id }, data: { barcode } });
    revalidatePath('/admin/products');
    return barcode;
}

export async function toggleStockStatus(id: string, inStock: boolean) {
    await prisma.product.update({ where: { id }, data: { inStock } as any });
    revalidatePath('/admin/products');
    revalidatePath('/admin/pos');
}

export async function stockIn(productId: string, qty: number, supplierId?: string, note?: string) {
    await prisma.$transaction([
        prisma.product.update({ where: { id: productId }, data: { stockQty: { increment: qty } } }),
        prisma.stockMovement.create({
            data: { productId, type: 'STOCK_IN', qtyChange: qty, supplierId, note },
        }),
    ]);
    revalidatePath('/admin/inventory');
}

export async function getCategories() {
    return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export async function createCategory(name: string) {
    const cat = await prisma.category.create({ data: { name } });
    revalidatePath('/admin/products');
    return cat;
}