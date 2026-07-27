import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export function QrCode({ value, size = 140 }: { value: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    QRCode.toCanvas(ref.current, value, {
      width: size,
      margin: 1,
      color: { dark: "#0a0e1a", light: "#ffffff" },
    }).catch(() => {});
  }, [value, size]);
  return <canvas ref={ref} style={{ borderRadius: 8 }} />;
}
