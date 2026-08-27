'use client';
import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export default function BarcodeLabel({ value, productName, price }: { value: string; productName?: string; price?: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current && value) {
            JsBarcode(canvasRef.current, value, {
                format: 'CODE128',
                width: 2,
                height: 50,
                fontSize: 14,
                margin: 5,
            });
        }
    }, [value]);

    function handlePrint() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        const win = window.open('', '_blank', 'width=400,height=300');
        if (!win) return;
        win.document.write(`
      <html>
        <head><title>Print Barcode</title></head>
        <body style="text-align:center; font-family: sans-serif; padding: 10px;">
          ${productName ? `<div style="font-size:12px; font-weight:bold;">${productName}</div>` : ''}
          ${price !== undefined ? `<div style="font-size:12px;">Rs ${price.toFixed(2)}</div>` : ''}
          <img src="${dataUrl}" />
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
        win.document.close();
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <canvas ref={canvasRef} />
            <button onClick={handlePrint} className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500">
                Print Label
            </button>
        </div>
    );
}