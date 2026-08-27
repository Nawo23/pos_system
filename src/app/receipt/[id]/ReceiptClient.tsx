'use client';

export default function ReceiptClient({ sale }: { sale: any }) {
    return (
        <div className="mx-auto max-w-xs bg-white p-4 font-mono text-black print:max-w-none">
            <h1 className="text-center text-lg font-bold">YOUR SHOP NAME</h1>
            <p className="text-center text-xs">Invoice: {sale.invoiceNo}</p>
            <p className="text-center text-xs">{new Date(sale.createdAt).toLocaleString()}</p>
            <hr className="my-2 border-dashed border-black" />
            {sale.items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-xs">
                    <span>{item.product.name} x{item.qty}</span>
                    <span>{Number(item.lineTotal).toFixed(2)}</span>
                </div>
            ))}
            <hr className="my-2 border-dashed border-black" />
            <div className="flex justify-between text-xs"><span>Subtotal</span><span>{Number(sale.subtotal).toFixed(2)}</span></div>
            <div className="flex justify-between text-xs"><span>Discount</span><span>{Number(sale.discount).toFixed(2)}</span></div>
            <div className="flex justify-between font-bold"><span>Total</span><span>Rs {Number(sale.total).toFixed(2)}</span></div>
            <p className="mt-2 text-center text-xs">Thank you!</p>
            <button onClick={() => window.print()} className="mt-4 w-full bg-black py-2 text-white print:hidden">
                Print
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
