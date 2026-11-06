"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { Camera, QrCode, X } from "lucide-react";

export default function BookQrScanner({ onScan }: { onScan: (code: string) => void }) {
  const [scanOpen, setScanOpen] = useState(false);
  const [scanError, setScanError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!scanOpen || !videoRef.current) return;

    let active = true;
    let controls: IScannerControls | undefined;
    const reader = new BrowserQRCodeReader();

    reader.decodeFromConstraints(
      { video: { facingMode: { ideal: "environment" } } },
      videoRef.current,
      (result) => {
        if (!result || !active) return;
        const code = result.getText().trim();
        if (!code) return;

        setScanOpen(false);
        onScan(code);
      },
    ).then((scannerControls) => {
      controls = scannerControls;
      if (!active) controls.stop();
    }).catch((reason: unknown) => {
      if (!active) return;
      setScanError(reason instanceof Error
        ? `Could not start the camera: ${reason.message}`
        : "Could not start the camera. Allow camera access, or try again.");
    });

    return () => {
      active = false;
      controls?.stop();
    };
  }, [onScan, scanOpen]);

  return (
    <>
      <button type="button" onClick={() => { setScanError(""); setScanOpen(true); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#ded9ca] bg-white px-4 text-xs font-semibold text-[#42536a] transition hover:bg-[#f2f0e9]">
        <QrCode size={16} /> <Camera size={15} /> Scan book
      </button>
      {scanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#122031]/70 p-3 backdrop-blur-sm sm:p-6">
          <section role="dialog" aria-modal="true" aria-labelledby="book-qr-title" className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#e9e6de] bg-[#fbfaf6] shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-[#eeece5] p-4 sm:p-5">
              <div>
                <h2 id="book-qr-title" className="text-sm font-semibold text-[#27364b]">Scan a book QR code</h2>
                <p className="mt-1 text-[10px] leading-5 text-[#838d99]">Point the camera at the QR code containing the book&apos;s catalog code.</p>
              </div>
              <button type="button" aria-label="Close QR scanner" onClick={() => { setScanOpen(false); setScanError(""); }} className="rounded-full p-2 text-[#647184] hover:bg-[#ece9e1]">
                <X size={18} />
              </button>
            </header>
            <div className="space-y-3 p-4 sm:p-5">
              <video ref={videoRef} className="aspect-video w-full rounded-xl bg-[#17243b] object-cover" muted autoPlay playsInline />
              {scanError && <p role="alert" className="rounded-lg border border-[#edd8d2] bg-[#fff4f0] px-3 py-2.5 text-xs leading-5 text-[#9e5745]">{scanError}</p>}
              <p className="text-[10px] leading-5 text-[#89929b]">Camera access is used only while this scanner is open. Camera scanning requires a secure connection such as HTTPS.</p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
