'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return setError(error.message);
        router.push('/admin/dashboard');
        router.refresh();
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-950">
            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 rounded-lg bg-neutral-900 p-8">
                <h1 className="text-xl font-semibold text-white">POS Login</h1>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded bg-neutral-800 px-3 py-2 text-white outline-none"
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded bg-neutral-800 px-3 py-2 text-white outline-none"
                    required
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button type="submit" className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-500">
                    Sign In
                </button>
            </form>
        </div>
    );
}