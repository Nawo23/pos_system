import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
    await prisma.category.createMany({
        data: [
            { name: 'Electrical - Cables & Wiring' },
            { name: 'Electrical - Switches & Sockets' },
            { name: 'Vehicle - Engine Parts' },
            { name: 'Vehicle - Brake System' },
            { name: 'Vehicle - Lighting' },
            { name: 'Batteries' },
            { name: 'Lubricants & Fluids' },
        ],
        skipDuplicates: true,
    });

    // Replace authId with the UUID from Supabase Auth > Users after creating your admin login
    await prisma.user.upsert({
        where: { authId: 'PASTE_SUPABASE_AUTH_UUID_HERE' },
        update: {},
        create: {
            authId: 'PASTE_SUPABASE_AUTH_UUID_HERE',
            name: 'Admin',
            role: 'ADMIN',
        },
    });
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });