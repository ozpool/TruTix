import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

const REGION_ID = "trutix-qr-region";

interface Props {
  onResult: (text: string) => void;
}

/// Thin wrapper over html5-qrcode: starts the rear camera on mount, forwards
/// each decoded QR string to onResult (ignoring repeats of the last value), and
/// tears the camera down on unmount.
export function QrScanner({ onResult }: Props) {
  const lastRef = useRef<string | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode(REGION_ID);
    let started = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (text) => {
          if (text === lastRef.current) return;
          lastRef.current = text;
          onResult(text);
        },
        () => {},
      )
      .then(() => {
        started = true;
      })
      .catch(() => {});

    return () => {
      if (started) void scanner.stop().catch(() => {});
    };
  }, [onResult]);

  return <div id={REGION_ID} className="mx-auto w-full max-w-sm" />;
}
