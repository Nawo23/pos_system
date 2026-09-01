'use client';

export default function ReceiptClient({ sale }: { sale: any }) {
    const total = Number(sale.total);
    const paidAmount = sale.paidAmount !== null && sale.paidAmount !== undefined ? Number(sale.paidAmount) : total;
    const changeAmount = sale.changeAmount !== null && sale.changeAmount !== undefined ? Number(sale.changeAmount) : (paidAmount - total);

    const paymentMethodLabel =
        sale.paymentMethod === 'CARD' ? 'Card' :
        sale.paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' : 'Cash';

    return (
        <div className="mx-auto max-w-xs bg-white p-4 font-mono text-black print:max-w-none">
            <h1 className="text-center text-lg font-bold uppercase tracking-wider">YOUR SHOP NAME</h1>
            <p className="text-center text-xs mt-1">Invoice: {sale.invoiceNo}</p>
            {sale.customer && (
                <p className="text-center text-xs">Customer: {sale.customer.name}</p>
            )}
            <p className="text-center text-xs">{new Date(sale.createdAt).toLocaleString()}</p>
            <hr className="my-2 border-dashed border-black" />
            {sale.items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-xs py-0.5">
                    <span>{item.product.name} x{item.qty}</span>
                    <span>Rs {Number(item.lineTotal).toFixed(2)}</span>
                </div>
            ))}
            <hr className="my-2 border-dashed border-black" />
            <div className="flex justify-between text-xs"><span>Subtotal</span><span>Rs {Number(sale.subtotal).toFixed(2)}</span></div>
            {Number(sale.discount) > 0 && (
                <div className="flex justify-between text-xs"><span>Discount</span><span>- Rs {Number(sale.discount).toFixed(2)}</span></div>
            )}
            <div className="flex justify-between font-bold text-sm my-1"><span>Total</span><span>Rs {total.toFixed(2)}</span></div>
            <hr className="my-2 border-dashed border-black" />
            <div className="flex justify-between text-xs"><span>Payment Method</span><span>{paymentMethodLabel}</span></div>
            <div className="flex justify-between text-xs"><span>Paid Amount</span><span>Rs {paidAmount.toFixed(2)}</span></div>
            {changeAmount >= 0 ? (
                <div className="flex justify-between text-xs font-bold"><span>Change Due</span><span>Rs {changeAmount.toFixed(2)}</span></div>
            ) : (
                <div className="flex justify-between text-xs font-bold"><span>Remaining Balance</span><span>Rs {Math.abs(changeAmount).toFixed(2)}</span></div>
            )}
            <hr className="my-2 border-dashed border-black" />
            <p className="mt-3 text-center text-xs">Thank you for your business!</p>
            <button onClick={() => window.print()} className="mt-4 w-full bg-black py-2.5 text-xs font-bold uppercase text-white print:hidden">
                Print Receipt
            </button>

            <style>{`
        @media print {
          @page { size: 80mm auto; margin: 0; }
          body { margin: 0; }
        }
      `}</style>
        </div>
    );
}

