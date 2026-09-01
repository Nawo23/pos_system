'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

const VALID_VEHICLE_TYPES = new Set([
    'CAR', 'BIKE', 'THREE_WHEELER', 'VAN', 'TRUCK', 'BUS', 'UNIVERSAL'
]);

function sanitizeVehicleType(type?: string): string {
    if (!type) return 'UNIVERSAL';
    const upper = type.toUpperCase();
    if (upper === 'MOTORCYCLE') return 'BIKE';
    if (upper === 'LORRY') return 'TRUCK';
    if (VALID_VEHICLE_TYPES.has(upper)) return upper;
    return 'UNIVERSAL';
}

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

function handlePrismaError(err: unknown): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            const target = (err.meta?.target as string[]) || [];
            const targetStr = Array.isArray(target) ? target.join(', ') : String(target);
            if (targetStr.includes('sku')) {
                throw new Error('A product with this SKU already exists. Please use a unique SKU.');
            }
            if (targetStr.includes('barcode')) {
                throw new Error('A product with this Barcode already exists. Please use a unique Barcode.');
            }
            throw new Error(`A product with this ${targetStr} already exists.`);
        }
    }
    throw err;
}

export async function createProduct(data: {
    sku: string; name: string; brand?: string; categoryId: string;
    vehicleType: string; vehicleBrandId?: string;
    unit: string; costPrice: number; sellPrice: number; stockQty: number; lowStockAt: number;
    barcode?: string; imageUrl?: string;
}) {
    try {
        const barcode = data.barcode?.trim() || generateBarcodeValue();
        const vehicleType = sanitizeVehicleType(data.vehicleType);
        const payload = { ...data, barcode, vehicleType, vehicleBrandId: data.vehicleBrandId || null };
        const product = await prisma.product.create({ data: payload as any });
        revalidatePath('/admin/products');
        return product;
    } catch (err) {
        handlePrismaError(err);
    }
}

export async function updateProduct(id: string, data: Partial<{
    sku: string; name: string; brand: string; categoryId: string; vehicleType: string; vehicleBrandId: string | null;
    unit: string; costPrice: number; sellPrice: number; lowStockAt: number; barcode: string; imageUrl: string;
}>) {
    try {
        const payload = { ...data };
        if (payload.vehicleType) {
            payload.vehicleType = sanitizeVehicleType(payload.vehicleType);
        }
        await prisma.product.update({ where: { id }, data: payload as any });
        revalidatePath('/admin/products');
    } catch (err) {
        handlePrismaError(err);
    }
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