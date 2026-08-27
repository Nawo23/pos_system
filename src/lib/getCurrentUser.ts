import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function getCurrentUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    let dbUser = await prisma.user.findUnique({ where: { authId: user.id } });

    if (!dbUser) {
        try {
            dbUser = await prisma.user.create({
                data: {
                    authId: user.id,
                    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                    role: 'ADMIN',
                },
            });
        } catch {
            // In case of race condition or existing record
            dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
        }
    }

    return dbUser;
}