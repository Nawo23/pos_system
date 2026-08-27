'use client';
import { useState, useEffect, useRef } from 'react';
import { searchProducts, checkout } from '@/app/actions/sales';
import { getProductByBarcode } from '@/app/actions/products';
import { getCustomerByPhone } from '@/app/actions/customers';
import BarcodeScannerModal from '@/components/BarcodeScannerModal';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ScanLine, LayoutDashboard, LogOut } from 'lucide-react';

type Product = { id: string; sku: string; name: string; sellPrice: number; stockQty: number };
type CartLine = Product & { qty: number };

export default function PosClient() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartLine[]>([]);
    const [discount, setDiscount] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [phone, setPhone] = useState('');
    const [matchedCustomer, setMatchedCustomer] = useState<{ id: string; name: string; isRegular: boolean; discountRate: number } | null>(null);
    const [showScanner, setShowScanner] = useState(false);
    const [scanError, setScanError] = useState('');
    const router = useRouter();
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    async function handleLogout() {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    }

    const barcodeBuffer = useRef('');
    const lastKeyTime = useRef(0);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            const active = document.activeElement;
            const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
            if (isTyping) return;

            const now = Date.now();
            if (now - lastKeyTime.current > 100) {
                barcodeBuffer.current = '';
            }
            lastKeyTime.current = now;

            if (e.key === 'Enter') {
                if (barcodeBuffer.current.length >= 4) {
                    handleBarcodeScanned(barcodeBuffer.current);
                }
                barcodeBuffer.current = '';
            } else if (e.key.length === 1) {
                barcodeBuffer.current += e.key;
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    async function handleBarcodeScanned(code: string) {
        setScanError('');
        const product = await getProductByBarcode(code);
        if (!product) {
            setScanError(`No product found for barcode ${code}`);
            setTimeout(() => setScanError(''), 3000);
            return;
        }
        addToCart({ id: product.id, sku: product.sku, name: product.name, sellPrice: Number(product.sellPrice), stockQty: product.stockQty });
    }

    async function handleSearch(q: string) {
        setQuery(q);
        if (q.length < 2) return setResults([]);
        const res = await searchProducts(q);
        setResults(res.map((p) => ({ ...p, sellPrice: Number(p.sellPrice) })));
    }

    function addToCart(p: Product) {
        setCart((prev) => {
            const existing = prev.find((c) => c.id === p.id);
            if (existing) {
                return prev.map((c) => (c.id === p.id ? { ...c, qty: c.qty + 1 } : c));
            }
            return [...prev, { ...p, qty: 1 }];
        });
        setResults([]);
        setQuery('');
    }

    function updateQty(id: string, qty: number) {
        if (qty < 1) return removeFromCart(id);
        setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty } : c)));
    }

    function removeFromCart(id: string) {
        setCart((prev) => prev.filter((c) => c.id !== id));
    }

    const subtotal = cart.reduce((s, c) => s + c.qty * c.sellPrice, 0);
    const total = subtotal - discount;

    async function handlePhoneChange(value: string) {
        setPhone(value);
        if (value.length < 9) { setMatchedCustomer(null); return; }
        const customer = await getCustomerByPhone(value);
        if (customer) {
            setMatchedCustomer({ ...customer, discountRate: Number(customer.discountRate) });
            if (customer.isRegular && Number(customer.discountRate) > 0) {
                setDiscount(Math.round(subtotal * (Number(customer.discountRate) / 100)));
            }
        } else {
            setMatchedCustomer(null);
        }
    }

    async function handleCheckout() {
        setProcessing(true);
        try {
            const sale = await checkout(
                cart.map((c) => ({ productId: c.id, qty: c.qty, unitPrice: c.sellPrice })),
                discount,
                'CASH',
                matchedCustomer?.id
            );
            setCart([]);
            setDiscount(0);
            setPhone('');
            setMatchedCustomer(null);
            window.open(`/receipt/${sale.id}`, '_blank');
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Checkout failed');
        } finally {
            setProcessing(false);
        }
    }

    return (
        <div className="flex min-h-screen h-full w-full bg-neutral-950 text-white">
            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                <header className="mb-4 flex items-center justify-between border-b border-neutral-800 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-yellow-500 text-xs font-bold text-black">
                            POS
                        </div>
                        <div>
                            <h1 className="text-sm font-semibold text-white">Auto & Electric Parts</h1>
                            <p className="text-[10px] uppercase tracking-wider text-neutral-400">Cashier Terminal</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isAdmin && (
                            <Link
                                href="/admin/dashboard"
                                className="flex items-center gap-2 rounded bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 transition"
                            >
                                <LayoutDashboard size={15} />
                                Admin Dashboard
                            </Link>
                        )}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-950/50 transition border border-neutral-800"
                        >
                            <LogOut size={15} />
                            Log Out
                        </button>
                    </div>
                </header>
                <div className="flex gap-2">
                    <input
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search product name or SKU, or scan barcode..."
                        className="flex-1 rounded bg-neutral-800 px-4 py-3 outline-none"
                    />
                    <button onClick={() => setShowScanner(true)} className="flex items-center gap-2 rounded bg-yellow-500 px-4 py-3 text-black">
                        <ScanLine size={18} /> Scan
                    </button>
                </div>

                {scanError && <p className="mt-2 text-sm text-red-500">{scanError}</p>}

                {results.length > 0 && (
                    <div className="mt-2 rounded bg-neutral-800">
                        {results.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => addToCart(p)}
                                className="flex w-full justify-between px-4 py-2 hover:bg-neutral-700 text-left"
                            >
                                <span>{p.name} <span className="text-neutral-400 text-sm">({p.sku})</span></span>
                                <span>Rs {p.sellPrice.toFixed(2)} · stock {p.stockQty}</span>
                            </button>
                        ))}
                    </div>
                )}

                <p className="mt-4 text-xs text-neutral-500">Tip: click outside a text box and scan with a USB/Bluetooth barcode scanner — it adds the item automatically.</p>
            </div>

            <div className="w-96 border-l border-neutral-800 p-6 flex flex-col">
                <h2 className="mb-4 text-lg font-semibold">Cart</h2>

                <div className="mb-3">
                    <input
                        placeholder="Customer phone number"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="w-full rounded bg-neutral-800 px-3 py-2 text-sm outline-none"
                    />
                    {matchedCustomer && (
                        <div className={`mt-2 rounded px-3 py-2 text-sm ${matchedCustomer.isRegular ? 'bg-green-900 text-green-300' : 'bg-neutral-800 text-neutral-300'}`}>
                            {matchedCustomer.isRegular
                                ? `⭐ ${matchedCustomer.name} — Daily Customer (${matchedCustomer.discountRate}% discount applied)`
                                : `${matchedCustomer.name} — regular customer`}
                        </div>
                    )}
                    {phone.length >= 9 && !matchedCustomer && (
                        <div className="mt-2 rounded bg-neutral-800 px-3 py-2 text-sm text-neutral-500">New number — not in customer list</div>
                    )}
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto">
                    {cart.map((c) => (
                        <div key={c.id} className="flex items-center justify-between rounded bg-neutral-900 p-2">
                            <div>
                                <p className="text-sm">{c.name}</p>
                                <p className="text-xs text-neutral-400">Rs {c.sellPrice.toFixed(2)} each</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={c.qty}
                                    onChange={(e) => updateQty(c.id, Number(e.target.value))}
                                    className="w-14 rounded bg-neutral-800 px-2 py-1 text-center"
                                />
                                <button onClick={() => removeFromCart(c.id)} className="text-red-500">×</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 space-y-2 border-t border-neutral-800 pt-4">
                    <div className="flex justify-between text-sm"><span>Subtotal</span><span>Rs {subtotal.toFixed(2)}</span></div>
                    <div className="flex items-center justify-between text-sm">
                        <span>Discount</span>
                        <input
                            type="number"
                            value={discount}
                            onChange={(e) => setDiscount(Number(e.target.value))}
                            className="w-20 rounded bg-neutral-800 px-2 py-1 text-right"
                        />
                    </div>
                    <div className="flex justify-between text-lg font-semibold"><span>Total</span><span>Rs {total.toFixed(2)}</span></div>
                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || processing}
                        className="w-full rounded bg-blue-600 py-3 font-medium hover:bg-blue-500 disabled:opacity-50"
                    >
                        {processing ? 'Processing...' : 'Complete Sale'}
                    </button>
                </div>
            </div>

            {showScanner && (
                <BarcodeScannerModal
                    onScan={(code) => { handleBarcodeScanned(code); setShowScanner(false); }}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
}