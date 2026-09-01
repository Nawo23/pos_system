'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { checkout } from '@/app/actions/sales';
import { getCustomerByPhone, quickAddCustomer } from '@/app/actions/customers';
import BarcodeScannerModal from '@/components/BarcodeScannerModal';
import { ScanLine, Minus, Plus, X } from 'lucide-react';

type Product = {
    id: string; sku: string; barcode: string | null; name: string;
    sellPrice: number; stockQty: number; categoryId: string;
    imageUrl: string | null; inStock: boolean;
};
type Category = { id: string; name: string };
type CartLine = Product & { qty: number };
type MatchedCustomer = { id: string; name: string; isRegular: boolean; discountRate: number };

export default function PosClient({ initialProducts, categories }: { initialProducts: Product[]; categories: Category[] }) {
    const [products] = useState(initialProducts);
    const [activeCategory, setActiveCategory] = useState<string>('ALL');
    const [productSearch, setProductSearch] = useState('');
    const [cart, setCart] = useState<CartLine[]>([]);
    const [discount, setDiscount] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [scanError, setScanError] = useState('');

    const [phone, setPhone] = useState('');
    const [matchedCustomer, setMatchedCustomer] = useState<MatchedCustomer | null>(null);
    const [customerLookupState, setCustomerLookupState] = useState<'idle' | 'notfound'>('idle');
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');

    const barcodeBuffer = useRef('');
    const lastKeyTime = useRef(0);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            const active = document.activeElement;
            const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
            if (isTyping) return;

            const now = Date.now();
            if (now - lastKeyTime.current > 100) barcodeBuffer.current = '';
            lastKeyTime.current = now;

            if (e.key === 'Enter') {
                if (barcodeBuffer.current.length >= 4) handleBarcodeScanned(barcodeBuffer.current);
                barcodeBuffer.current = '';
            } else if (e.key.length === 1) {
                barcodeBuffer.current += e.key;
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    function handleBarcodeScanned(code: string) {
        setScanError('');
        const product = products.find((p) => p.barcode === code);
        if (!product) {
            setScanError(`No product found for barcode ${code}`);
            setTimeout(() => setScanError(''), 3000);
            return;
        }
        addToCart(product);
    }

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesCategory = activeCategory === 'ALL' || p.categoryId === activeCategory;
            const matchesSearch =
                productSearch.length < 2 ||
                p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                p.sku.toLowerCase().includes(productSearch.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [products, activeCategory, productSearch]);

    function addToCart(p: Product) {
        if (p.stockQty <= 0 || !p.inStock) return;
        setCart((prev) => {
            const existing = prev.find((c) => c.id === p.id);
            if (existing) {
                if (existing.qty >= p.stockQty) return prev;
                return prev.map((c) => (c.id === p.id ? { ...c, qty: c.qty + 1 } : c));
            }
            return [...prev, { ...p, qty: 1 }];
        });
    }

    function updateQty(id: string, qty: number) {
        if (qty < 1) return removeFromCart(id);
        setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty: Math.min(qty, c.stockQty) } : c)));
    }

    function removeFromCart(id: string) {
        setCart((prev) => prev.filter((c) => c.id !== id));
    }

    const subtotal = cart.reduce((s, c) => s + c.qty * c.sellPrice, 0);
    const total = Math.max(0, subtotal - discount);

    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER'>('CASH');
    const [paidAmountInput, setPaidAmountInput] = useState('');

    const paidAmountNum = paidAmountInput !== '' ? Number(paidAmountInput) : total;
    const changeDue = paidAmountNum - total;

    function clearCart() {
        setCart([]);
        setDiscount(0);
        setPaidAmountInput('');
        setPaymentMethod('CASH');
    }

    async function handlePhoneFind() {
        if (phone.length < 9) return;
        const customer = await getCustomerByPhone(phone);
        if (customer) {
            setMatchedCustomer({ ...customer, discountRate: Number(customer.discountRate) });
            setCustomerLookupState('idle');
            setShowAddCustomer(false);
            if (customer.isRegular && Number(customer.discountRate) > 0) {
                setDiscount(Math.round(subtotal * (Number(customer.discountRate) / 100)));
            }
        } else {
            setMatchedCustomer(null);
            setCustomerLookupState('notfound');
        }
    }

    function resetCustomer() {
        setPhone('');
        setMatchedCustomer(null);
        setCustomerLookupState('idle');
        setShowAddCustomer(false);
        setNewCustomerName('');
    }

    async function handleCheckout() {
        if (cart.length === 0) return;
        setProcessing(true);
        try {
            const sale = await checkout(
                cart.map((c) => ({ productId: c.id, qty: c.qty, unitPrice: c.sellPrice })),
                discount,
                paymentMethod,
                matchedCustomer?.id,
                paidAmountNum,
                changeDue
            );
            clearCart();
            resetCustomer();
            window.open(`/receipt/${sale.id}`, '_blank');
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Checkout failed');
        } finally {
            setProcessing(false);
        }
    }
    const [addingCustomer, setAddingCustomer] = useState(false);

    async function handleAddCustomer() {
        if (!newCustomerName.trim()) {
            alert('Enter a customer name.');
            return;
        }
        if (phone.length < 9) {
            alert('Enter a valid phone number.');
            return;
        }
        setAddingCustomer(true);
        try {
            const customer = await quickAddCustomer(newCustomerName.trim(), phone);
            setMatchedCustomer({ id: customer.id, name: customer.name, isRegular: false, discountRate: 0 });
            setShowAddCustomer(false);
            setCustomerLookupState('idle');
            setNewCustomerName('');
        } catch (err) {
            alert('Could not add customer. This phone number may already be registered — try Find instead.');
        } finally {
            setAddingCustomer(false);
        }
    }

    return (
        <div className="flex h-screen text-white bg-[#0d0e10]">
            {/* LEFT: CART */}
            <div className="flex w-[420px] flex-col border-r border-[#22242a]">
                <div className="flex items-center justify-between border-b border-[#22242a] p-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Cart</h2>
                    <button
                        onClick={() => setShowScanner(true)}
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg, #60a5fa, #2563eb)', boxShadow: '0 0 14px 0 rgba(59,130,246,0.35)' }}
                    >
                        <ScanLine size={14} /> Scan
                    </button>
                </div>

                {scanError && <p className="px-4 pt-2 text-xs text-red-400">{scanError}</p>}

                <div className="flex-1 overflow-y-auto p-3">
                    {cart.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-neutral-600">
                            <p className="text-4xl">🛒</p>
                            <p className="mt-2 text-sm">Cart is empty. Click grid items to add.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {cart.map((c) => (
                                <div key={c.id} className="rounded-lg bg-[#16171a] border border-[#22242a] p-3">
                                    <div className="mb-1 flex items-start justify-between">
                                        <p className="text-sm font-medium">{c.name}</p>
                                        <button onClick={() => removeFromCart(c.id)} className="text-neutral-500 hover:text-red-400">
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => updateQty(c.id, c.qty - 1)} className="rounded bg-[#22242a] p-1"><Minus size={12} /></button>
                                            <span className="w-6 text-center text-sm">{c.qty}</span>
                                            <button onClick={() => updateQty(c.id, c.qty + 1)} className="rounded bg-[#22242a] p-1"><Plus size={12} /></button>
                                        </div>
                                        <div className="text-right text-sm">
                                            <p className="text-neutral-500">Rs {c.sellPrice.toFixed(2)} each</p>
                                            <p className="font-semibold" style={{ color: '#60a5fa' }}>Rs {(c.qty * c.sellPrice).toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* MIDDLE: CUSTOMER / DISCOUNT / TOTALS */}
            <div className="flex w-96 flex-col border-r border-[#22242a] p-4">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Customer</h2>
                    <button
                        onClick={() => setShowAddCustomer(true)}
                        className="text-xs font-medium hover:underline"
                        style={{ color: '#60a5fa' }}
                    >
                        + Add Customer
                    </button>
                </div>

                <div className="mb-1 flex gap-2">
                    <input
                        placeholder="Phone number"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); setMatchedCustomer(null); setCustomerLookupState('idle'); }}
                        className="flex-1 rounded-lg bg-[#16171a] border border-[#22242a] px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                    <button
                        onClick={handlePhoneFind}
                        className="rounded-lg px-4 text-sm font-medium text-white"
                        style={{ background: 'linear-gradient(135deg, #60a5fa, #2563eb)', boxShadow: '0 0 14px 0 rgba(59,130,246,0.35)' }}
                    >
                        Find
                    </button>
                </div>

                {matchedCustomer && (
                    <div className={`mt-2 flex items-center justify-between rounded-lg px-3 py-2 text-sm ${matchedCustomer.isRegular ? 'bg-green-500/10 text-green-300' : 'bg-[#16171a] text-neutral-300 border border-[#22242a]'}`}>
                        <span>
                            {matchedCustomer.isRegular
                                ? `⭐ ${matchedCustomer.name} — Daily Customer (${matchedCustomer.discountRate}% off)`
                                : matchedCustomer.name}
                        </span>
                        <button onClick={resetCustomer} className="text-neutral-500 hover:text-red-400"><X size={14} /></button>
                    </div>
                )}

                {customerLookupState === 'notfound' && !showAddCustomer && (
                    <p className="mt-2 text-xs text-red-400">No customer found for this number.</p>
                )}

                {showAddCustomer && (
                    <div className="mt-2 rounded-lg bg-[#16171a] border border-[#22242a] p-3">
                        <p className="mb-2 text-xs text-neutral-400">New customer</p>
                        <div className="space-y-2">
                            <input
                                placeholder="Phone number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full rounded bg-[#0d0e10] border border-[#22242a] px-2 py-1.5 text-sm outline-none"
                            />
                            <div className="flex gap-2">
                                <input
                                    placeholder="Customer name"
                                    value={newCustomerName}
                                    onChange={(e) => setNewCustomerName(e.target.value)}
                                    className="flex-1 rounded bg-[#0d0e10] border border-[#22242a] px-2 py-1.5 text-sm outline-none"
                                />
                                <button onClick={handleAddCustomer} className="rounded bg-green-600 px-3 text-sm">Add</button>
                                <button onClick={() => setShowAddCustomer(false)} className="rounded bg-[#22242a] px-3 text-sm">Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-4 border-t border-[#22242a] pt-3">
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Discount</h2>
                    <input
                        type="number"
                        value={discount || ''}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                        className="w-full rounded-lg bg-[#16171a] border border-[#22242a] px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                        placeholder="0.00"
                    />
                </div>

                <div className="mt-4 border-t border-[#22242a] pt-3">
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Payment Method</h2>
                    <div className="grid grid-cols-3 gap-1.5">
                        {[
                            { id: 'CASH', label: '💵 Cash' },
                            { id: 'CARD', label: '💳 Card' },
                            { id: 'BANK_TRANSFER', label: '🏦 Transfer' },
                        ].map((pm) => (
                            <button
                                key={pm.id}
                                type="button"
                                onClick={() => setPaymentMethod(pm.id as any)}
                                className={`rounded-lg py-1.5 text-xs font-medium border transition-all ${
                                    paymentMethod === pm.id
                                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold'
                                        : 'bg-[#16171a] border-[#22242a] text-neutral-400 hover:text-white'
                                }`}
                            >
                                {pm.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-3 border-t border-[#22242a] pt-3">
                    <div className="mb-1.5 flex items-center justify-between">
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Customer Paid</h2>
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => setPaidAmountInput(total.toString())}
                                className="rounded bg-[#22242a] px-1.5 py-0.5 text-[10px] text-blue-400 hover:bg-[#2a2c33]"
                            >
                                Exact
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaidAmountInput((prev) => (Number(prev || 0) + 500).toString())}
                                className="rounded bg-[#22242a] px-1.5 py-0.5 text-[10px] text-neutral-300 hover:bg-[#2a2c33]"
                            >
                                +500
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaidAmountInput((prev) => (Number(prev || 0) + 1000).toString())}
                                className="rounded bg-[#22242a] px-1.5 py-0.5 text-[10px] text-neutral-300 hover:bg-[#2a2c33]"
                            >
                                +1000
                            </button>
                        </div>
                    </div>
                    <input
                        type="number"
                        value={paidAmountInput}
                        onChange={(e) => setPaidAmountInput(e.target.value)}
                        className="w-full rounded-lg bg-[#16171a] border border-[#22242a] px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                        placeholder={`Exact total (Rs ${total.toFixed(2)})`}
                    />
                </div>

                <div className="mt-auto space-y-2 border-t border-[#22242a] pt-3">
                    <div className="flex justify-between text-xs text-neutral-400"><span>Subtotal</span><span>Rs {subtotal.toFixed(2)}</span></div>
                    {discount > 0 && (
                        <div className="flex justify-between text-xs text-neutral-400"><span>Discount</span><span>- Rs {discount.toFixed(2)}</span></div>
                    )}
                    <div className="flex justify-between text-lg font-bold"><span>Total</span><span style={{ color: '#60a5fa' }}>Rs {total.toFixed(2)}</span></div>

                    <div className="flex justify-between text-xs text-neutral-300 border-t border-[#22242a]/60 pt-1.5">
                        <span>Paid Amount</span>
                        <span className="font-semibold">Rs {paidAmountNum.toFixed(2)}</span>
                    </div>

                    {paidAmountInput !== '' && (
                        changeDue >= 0 ? (
                            <div className="flex justify-between text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                                <span>Change Due:</span>
                                <span>Rs {changeDue.toFixed(2)}</span>
                            </div>
                        ) : (
                            <div className="flex justify-between text-xs font-semibold text-red-400 bg-red-500/10 px-2 py-1 rounded">
                                <span>Remaining Balance:</span>
                                <span>Rs {Math.abs(changeDue).toFixed(2)}</span>
                            </div>
                        )
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-2">
                        <button onClick={clearCart} className="rounded-lg bg-[#22242a] py-2.5 text-sm font-medium hover:bg-[#2a2c33]">
                            Clear
                        </button>
                        <button
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || processing}
                            className="rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg, #60a5fa, #2563eb)', boxShadow: cart.length ? '0 0 16px 0 rgba(59,130,246,0.4)' : 'none' }}
                        >
                            {processing ? 'Processing...' : 'Pay / Print'}
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT: PRODUCT GRID */}
            <div className="flex flex-1 flex-col">
                <div className="border-b border-[#22242a] p-4">
                    <input
                        placeholder="Search product by name, SKU or barcode..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full rounded-lg bg-[#16171a] border border-[#22242a] px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto border-b border-[#22242a] p-3">
                    <button
                        onClick={() => setActiveCategory('ALL')}
                        className="whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold"
                        style={activeCategory === 'ALL'
                            ? { background: 'linear-gradient(135deg, #60a5fa, #2563eb)', color: '#fff', boxShadow: '0 0 12px 0 rgba(59,130,246,0.35)' }
                            : { background: 'rgba(255,255,255,0.05)', color: '#a3a3a3' }}
                    >
                        ALL
                    </button>
                    {categories.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => setActiveCategory(c.id)}
                            className="whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold"
                            style={activeCategory === c.id
                                ? { background: 'linear-gradient(135deg, #60a5fa, #2563eb)', color: '#fff', boxShadow: '0 0 12px 0 rgba(59,130,246,0.35)' }
                                : { background: 'rgba(255,255,255,0.05)', color: '#a3a3a3' }}
                        >
                            {c.name.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-4 gap-4">
                        {filteredProducts.map((p) => {
                            const inCart = cart.find((c) => c.id === p.id);
                            const outOfStock = p.stockQty <= 0 || !p.inStock;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => addToCart(p)}
                                    disabled={outOfStock}
                                    className="relative rounded-lg border p-3 text-left transition-all"
                                    style={{
                                        borderColor: outOfStock ? '#22242a' : inCart ? '#3b82f6' : '#22242a',
                                        background: '#16171a',
                                        opacity: outOfStock ? 0.4 : 1,
                                        cursor: outOfStock ? 'not-allowed' : 'pointer',
                                        boxShadow: inCart ? '0 0 14px 0 rgba(59,130,246,0.25)' : 'none',
                                    }}
                                >
                                    {inCart && (
                                        <span
                                            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                                            style={{ background: 'linear-gradient(135deg, #60a5fa, #2563eb)', boxShadow: '0 0 10px 0 rgba(59,130,246,0.5)' }}
                                        >
                                            {inCart.qty}
                                        </span>
                                    )}
                                    <div className="mb-2 h-20 w-full overflow-hidden rounded bg-[#0d0e10]">
                                        {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />}
                                    </div>
                                    <p className="text-lg font-bold" style={{ color: '#60a5fa' }}>Rs.{p.sellPrice.toFixed(0)}</p>
                                    <p className="text-xs text-neutral-500">{p.sku}</p>
                                    <p className="mt-1 text-sm font-medium">{p.name}</p>
                                    <p className={`mt-1 text-xs ${outOfStock ? 'text-red-400' : 'text-neutral-500'}`}>
                                        {outOfStock ? 'Out of stock' : `${p.stockQty} in stock`}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
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