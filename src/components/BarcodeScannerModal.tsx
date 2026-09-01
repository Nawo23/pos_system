'use client';
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { X, CameraOff } from 'lucide-react';

export default function BarcodeScannerModal({
    onScan,
    onClose,
}: {
    onScan: (code: string) => void;
    onClose: () => void;
}) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const scanner = new Html5Qrcode('barcode-reader');
        scannerRef.current = scanner;

        const stopScanner = async () => {
            try {
                if (scannerRef.current) {
                    const state = scannerRef.current.getState();
                    if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
                        await scannerRef.current.stop();
                    }
                }
            } catch {
                // Ignore stop errors if scanner wasn't active
            }
        };

        scanner
            .start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 150 } },
                async (decodedText) => {
                    if (!isMounted) return;
                    onScan(decodedText);
                    await stopScanner();
                    onClose();
                },
                () => { }
            )
            .catch((err) => {
                if (!isMounted) return;
                console.warn('Camera start failed:', err);
                const errMsg = String(err?.message || err);
                if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission')) {
                    setCameraError('Camera permission was denied. Please allow camera access in browser settings to scan barcodes.');
                } else if (errMsg.includes('NotFoundError') || errMsg.includes('DevicesNotFoundError')) {
                    setCameraError('No camera device found on this device.');
                } else {
                    setCameraError('Could not start camera scanner. You can enter the barcode manually.');
                }
            });

        return () => {
            isMounted = false;
            stopScanner();
        };
    }, [onScan, onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="relative w-full max-w-sm rounded-xl bg-[#16171a] border border-[#22242a] p-5 text-white shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-semibold">Scan Barcode</h3>
                    <button type="button" onClick={onClose} className="text-neutral-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {cameraError ? (
                    <div className="my-4 flex flex-col items-center justify-center text-center py-6 px-4 bg-[#0d0e10] rounded-lg border border-red-900/40">
                        <CameraOff size={36} className="text-red-400 mb-3" />
                        <p className="text-xs text-neutral-300 mb-4 leading-relaxed">{cameraError}</p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg bg-[#22242a] px-4 py-2 text-xs font-medium text-white hover:bg-[#2a2c33]"
                        >
                            Close & Enter Manually
                        </button>
                    </div>
                ) : (
                    <div>
                        <div id="barcode-reader" className="overflow-hidden rounded-lg border border-[#22242a]" />
                        <p className="mt-3 text-center text-xs text-neutral-400">Position barcode inside camera frame</p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-4 w-full rounded-lg bg-[#22242a] py-2 text-sm font-medium hover:bg-[#2a2c33]"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}