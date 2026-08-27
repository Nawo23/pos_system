import { createClient } from '@/lib/supabase/client';

export async function uploadProductImage(file: File): Promise<string> {
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from('products').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
    });
    if (error) throw error;

    const { data } = supabase.storage.from('products').getPublicUrl(fileName);
    return data.publicUrl;
}