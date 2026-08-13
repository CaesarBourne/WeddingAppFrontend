"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const QR_DARK = "#4A1030";
const QR_LIGHT = "#FFFFFF";

export function QrCell({ token }: { token: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  // window.location.origin doesn't change during the page's lifetime; reading
  // it directly during render (guarded for SSR) is pure and avoids a redundant
  // effect+setState round-trip just to move it into state.
  const url = typeof window !== "undefined" ? `${window.location.origin}/invite?t=${token}` : null;

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 160,
        margin: 1,
        color: { dark: QR_DARK, light: QR_LIGHT },
      });
    }
  }, [url]);

  function download() {
    if (!url) return;
    QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: { dark: QR_DARK, light: QR_LIGHT },
    }).then((dataUrl) => {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `wedding-qr-${token.slice(0, 8)}.png`;
      a.click();
    });
  }

  function copyLink() {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas ref={canvasRef} className="rounded-md border" />
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={download} title="Download QR code">
          <Download /> Save
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={copyLink} title="Copy guest link">
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>
    </div>
  );
}
