"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, CheckCircle2, RefreshCw } from "lucide-react";
import jsQR from "jsqr";
import { toast } from "sonner";
import { getGuestByTokenAction } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

type ScanState = "scanning" | "found" | "error" | "nopermission";

export function QRScannerClient() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const foundRef = useRef(false);

  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [foundName, setFoundName] = useState("");

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    foundRef.current = false;
    setScanState("scanning");
    setFoundName("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
    } catch {
      setScanState("nopermission");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Decode loop — sample ~8 fps
  useEffect(() => {
    let throttle = 0;

    const tick = (now: number) => {
      rafRef.current = requestAnimationFrame(tick);
      if (now - throttle < 120) return;
      throttle = now;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) return;
      if (foundRef.current) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imgData.data, imgData.width, imgData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code?.data) handleScanned(code.data);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleScanned(raw: string) {
    if (foundRef.current) return;
    foundRef.current = true;

    // Extract token from the guest URL (/invite?t=TOKEN or /guest?t=TOKEN)
    let token: string | null = null;
    try {
      const url = new URL(raw);
      token = url.searchParams.get("t");
    } catch {
      token = null;
    }

    if (!token) {
      toast.error("Not a valid wedding guest QR code. Try again.");
      setScanState("error");
      foundRef.current = false;
      return;
    }

    const result = await getGuestByTokenAction(token);
    if ("error" in result) {
      toast.error(result.error);
      setScanState("error");
      foundRef.current = false;
      return;
    }

    setFoundName(result.name);
    setScanState("found");

    // Short pause so the "Found!" state is visible, then navigate
    setTimeout(() => {
      router.push(`/admin/qr/${result.guestId}`);
    }, 800);
  }

  function retry() {
    foundRef.current = false;
    stopCamera();
    startCamera();
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      {/* Hidden canvas for jsQR processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Live camera feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        muted
        playsInline
        autoPlay
      />

      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Header */}
      <header className="relative z-10 flex items-center gap-3 bg-gradient-to-b from-black/60 to-transparent p-4">
        <Button
          variant="ghost"
          size="sm"
          className="border border-white/20 bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 hover:text-white"
          nativeButton={false}
          render={
            <Link href="/admin">
              <ArrowLeft /> Back
            </Link>
          }
        />
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
          Scan Guest QR
        </span>
      </header>

      {/* Scanning frame — centred */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            "relative",
            "h-[min(260px,72vw)] w-[min(260px,72vw)]",
          )}
        >
          {/* Corner brackets */}
          {(["tl", "tr", "bl", "br"] as const).map((pos) => (
            <span
              key={pos}
              className={cn(
                "absolute h-7 w-7 border-[3.5px]",
                scanState === "found" && "border-emerald-400",
                scanState === "error" || scanState === "nopermission"
                  ? "border-red-400"
                  : scanState === "scanning"
                    ? "border-amber-400"
                    : "",
                pos === "tl" && "left-0 top-0 rounded-tl-md border-b-0 border-r-0",
                pos === "tr" && "right-0 top-0 rounded-tr-md border-b-0 border-l-0",
                pos === "bl" && "bottom-0 left-0 rounded-bl-md border-r-0 border-t-0",
                pos === "br" && "bottom-0 right-0 rounded-br-md border-l-0 border-t-0",
              )}
            />
          ))}

          {/* Animated scan line */}
          {scanState === "scanning" && (
            <div className="animate-scan-sweep absolute left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
          )}
        </div>
      </div>

      {/* Footer status */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center bg-gradient-to-t from-black/70 to-transparent pb-safe p-8">
        {scanState === "scanning" && (
          <div className="flex items-center gap-2.5 rounded-full border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-white/80 backdrop-blur-sm">
            <Camera className="size-4" />
            Point camera at a guest&apos;s QR code
          </div>
        )}

        {scanState === "found" && (
          <div className="flex items-center gap-2.5 rounded-full border border-emerald-500/40 bg-emerald-950/70 px-4 py-2.5 text-sm text-emerald-300 backdrop-blur-sm">
            <CheckCircle2 className="size-4" />
            Found — {foundName} · redirecting…
          </div>
        )}

        {(scanState === "error" || scanState === "nopermission") && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-red-500/30 bg-black/60 px-5 py-4 text-center text-sm text-white/80 backdrop-blur-sm">
            <p>
              {scanState === "nopermission"
                ? "Camera access denied. Please allow camera permission in your browser settings."
                : "Invalid QR code. Please try again."}
            </p>
            {scanState === "error" && (
              <button
                onClick={retry}
                className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium hover:bg-white/20"
              >
                <RefreshCw className="size-3.5" /> Try again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
