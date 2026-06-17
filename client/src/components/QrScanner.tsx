import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const REGION_ID = "trutix-qr-region";

interface Props {
  onResult: (text: string) => void;
}

/// Thin wrapper over html5-qrcode: starts the rear camera once on mount, forwards
/// each newly decoded QR string to onResult (ignoring repeats), and tears the
/// camera down on unmount. onResult is held in a ref so a changing callback from
/// the parent does not restart the camera on every render. Start failures are
/// surfaced (permission, no camera, insecure origin) instead of silently dropped.
export function QrScanner({ onResult }: Props) {
  const lastRef = useRef<string | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode(REGION_ID);

    const ready = scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (text) => {
          if (text === lastRef.current) return;
          lastRef.current = text;
          onResultRef.current(text);
        },
        () => {},
      )
      .then(() => true)
      .catch((e: unknown) => {
        const msg = String((e as { message?: string })?.message ?? e);
        if (!window.isSecureContext) {
          setError(
            "Camera needs a secure connection — open the site over HTTPS (or on localhost).",
          );
        } else if (/permission|NotAllowed|denied/i.test(msg)) {
          setError("Camera access was blocked. Allow the camera in your browser, then reload.");
        } else if (/NotFound|no camera|Requested device/i.test(msg)) {
          setError("No camera was found on this device.");
        } else {
          setError("Could not start the camera. Close other apps using it and reload.");
        }
        return false;
      });

    return () => {
      void ready.then((started) => (started ? scanner.stop().catch(() => {}) : undefined));
    };
  }, []);

  return (
    <div className="space-y-2">
      <div
        id={REGION_ID}
        className="mx-auto grid aspect-square w-full max-w-sm place-items-center overflow-hidden rounded-xl bg-ink-950 text-xs text-slate-500"
      >
        {!error && "Starting camera…"}
      </div>
      {error && (
        <p className="text-center text-sm text-rose-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
