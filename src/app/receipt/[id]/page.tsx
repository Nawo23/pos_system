import { prisma } from '@/lib/prisma';
import { SHOP } from '@/lib/shopInfo';
import ReceiptBarcode from '@/components/ReceiptBarcode';
import ReceiptPrintButton from './ReceiptPrintButton';

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sale = await prisma.sale.findUniqueOrThrow({
        where: { id },
        include: { items: { include: { product: true } }, customer: true, user: true },
    });

    const grossAmount = sale.items.reduce((sum, i) => sum + Number(i.unitPrice) * i.qty, 0);
    const discount = Number(sale.discount);
    const total = Number(sale.total);
    const dateObj = new Date(sale.createdAt);
    const dateStr = dateObj.toISOString().slice(0, 10);
    const timeStr = dateObj.toTimeString().slice(0, 8);

    return (
        <div className="flex min-h-screen justify-center bg-neutral-800 py-6 print:bg-white print:py-0">
            <div className="w-[300px] bg-white p-4 font-mono text-black print:w-full">
                <div className="text-center">
                    <h1 className="text-lg font-black tracking-wide">{SHOP.name}</h1>
                    {SHOP.address && <p className="text-[11px]">{SHOP.address}</p>}
                    {SHOP.phone && <p className="text-[11px]">{SHOP.phone}</p>}
                </div>

                <div className="my-2 border-t border-dashed border-black text-center text-[11px]">
                    <span className="relative -top-2 bg-white px-2">BILL</span>
                </div>

                <div className="flex justify-between text-[11px]">
                    <span>{dateStr}</span>
                    <span>{timeStr}</span>
                </div>
                <div className="text-[11px]">
                    <span>Bill No: {sale.invoiceNo}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                    <span>Cashier: {sale.user.name}</span>
                </div>
                <div className="text-[11px]">
                    Customer: {sale.customer?.name ?? 'Cash'}
                </div>

                <div className="my-2 border-t border-dashed border-black" />

                <div className="grid grid-cols-[16px_1fr_50px] text-[11px] font-semibold">
                    <span>#</span><span>Product</span><span className="text-right">Amount</span>
                </div>
                <div className="my-1 border-t border-dashed border-black" />

                {sale.items.map((item, idx) => (
                    <div key={item.id} className="mb-1.5 text-[11px]">
                        <div className="grid grid-cols-[16px_1fr]">
                            <span>{idx + 1}</span>
                            <span className="font-semibold">{item.product.name}</span>
                        </div>
                        <div className="grid grid-cols-[16px_1fr_40px_50px] text-neutral-700">
                            <span></span>
                            <span>Rs {Number(item.unitPrice).toFixed(2)}</span>
                            <span>x{item.qty}</span>
                            <span className="text-right font-medium text-black">{Number(item.lineTotal).toFixed(2)}</span>
                        </div>
                    </div>
                ))}

                <div className="my-2 border-t border-dashed border-black" />

                <div className="space-y-0.5 text-[11px]">
                    <div className="flex justify-between"><span>GROSS AMOUNT</span><span>{grossAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>DISCOUNT</span><span>{discount.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm font-bold"><span>TOTAL</span><span>{total.toFixed(2)}</span></div>
                </div>

                <div className="my-2 border-t border-dashed border-black" />

                <div className="space-y-0.5 text-[11px]">
                    <div className="flex justify-between"><span>PAID BY {sale.paymentMethod}</span><span>{total.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Due</span><span>0.00</span></div>
                    <div className="flex justify-between"><span>No of Items</span><span>{sale.items.length}</span></div>
                </div>

                <div className="my-2 border-t border-dashed border-black" />

                <p className="text-center text-[11px] font-medium">THANK YOU, PLEASE COME AGAIN</p>

                <div className="mt-2 flex justify-center">
                    <ReceiptBarcode value={sale.invoiceNo} />
                </div>

                <ReceiptPrintButton />

                <style>{`
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body { margin: 0; }
          }
        `}</style>
            </div>
        </div>
    );
}