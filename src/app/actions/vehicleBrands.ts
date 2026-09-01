'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getVehicleBrands() {
    return prisma.vehicleBrand.findMany({ orderBy: { name: 'asc' } });
}

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

export async function createVehicleBrand(name: string, vehicleType: string) {
    const sanitizedType = sanitizeVehicleType(vehicleType);
    const brand = await prisma.vehicleBrand.create({ data: { name, vehicleType: sanitizedType as any } });
    revalidatePath('/admin/products');
    return brand;
}

