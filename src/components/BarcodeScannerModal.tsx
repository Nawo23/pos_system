'use client';
import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function BarcodeScannerModal({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) {
    const scannerRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        const scanner = new Html5Qrcode('barcode-reader');
        scannerRef.current = scanner;
        scanner
            .start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 150 } },
                (decodedText) => {
                    onScan(decodedText);
                    scanner.stop().catch(() => { });
                },
                () => { }
            )
            .catch((err) => console.error('Camera start failed', err));

        return () => {
            scanner.stop().catch(() => { });
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="rounded bg-neutral-900 p-4">
                <div id="barcode-reader" className="w-80" />
                <button onClick={onClose} className="mt-3 w-full rounded bg-neutral-700 py-2 text-white">Close</button>
            </div>
        </div>
    );
}