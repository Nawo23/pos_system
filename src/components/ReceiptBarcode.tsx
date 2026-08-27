'use client';
import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export default function ReceiptBarcode({ value }: { value: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current && value) {
            JsBarcode(canvasRef.current, value, {
                format: 'CODE128',
                width: 1.4,
                height: 40,
                displayValue: false,
                margin: 0,
            });
        }
    }, [value]);

    return <canvas ref={canvasRef} />;
}