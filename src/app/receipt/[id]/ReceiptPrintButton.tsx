'use client';
import { useState, useEffect } from 'react';

export default function ReceiptPrintButton() {
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        function handleAfterPrint() {
            setShowConfirm(true);
            setTimeout(() => setShowConfirm(false), 2500);
        }
        window.addEventListener('afterprint', handleAfterPrint);
        return () => window.removeEventListener('afterprint', handleAfterPrint);
    }, []);

    return (
        <>
            <button
                onClick={() => window.print()}
                className="mt-4 w-full rounded bg-black py-2 text-sm font-semibold text-white print:hidden"
            >
                Print Bill
            </button>

            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 print:hidden">
                    <div className="rounded-lg bg-white px-6 py-5 text-center shadow-xl">
                        <p className="text-2xl">✅</p>
                        <p className="mt-2 font-semibold text-black">Bill Printed Successfully</p>
                    </div>
                </div>
            )}
        </>
    );
}