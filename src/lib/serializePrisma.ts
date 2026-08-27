export function serializePrisma<T>(obj: T): T {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (typeof obj === 'object') {
        // Handle Decimal instances (from Prisma or decimal.js)
        if ('toNumber' in obj && typeof (obj as any).toNumber === 'function') {
            return (obj as any).toNumber() as unknown as T;
        }

        // Handle Date instances
        if (obj instanceof Date) {
            return obj.toISOString() as unknown as T;
        }

        // Handle Arrays
        if (Array.isArray(obj)) {
            return obj.map((item) => serializePrisma(item)) as unknown as T;
        }

        // Handle plain objects
        const result: Record<string, any> = {};
        for (const key of Object.keys(obj)) {
            result[key] = serializePrisma((obj as Record<string, any>)[key]);
        }
        return result as T;
    }

    return obj;
}
