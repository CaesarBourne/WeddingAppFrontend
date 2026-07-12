"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { OrderNotification } from "@/lib/types";

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // AudioContext blocked or unsupported — silently skip
  }
}

export function AdminNotificationBell() {
  const [unread, setUnread] = useState(0);
  const [ringing, setRinging] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/food/stream");
    esRef.current = es;

    es.onmessage = (e: MessageEvent) => {
      let notification: OrderNotification;
      try {
        notification = JSON.parse(e.data as string) as OrderNotification;
      } catch {
        return;
      }

      playNotificationSound();
      setUnread((n) => n + 1);
      setRinging(true);
      setTimeout(() => setRinging(false), 1200);

      const emoji = notification.category === "drink" ? "🥂" : "🍽️";
      const seat = notification.seatNumber ? ` · Seat ${notification.seatNumber}` : "";

      toast(
        `${emoji} New ${notification.category} order`,
        {
          description: `${notification.guestName}${seat} chose ${notification.foodItemName}`,
          duration: 8000,
        },
      );
    };

    es.onerror = () => {
      // Reconnect silently — EventSource auto-retries on network errors
    };

    return () => {
      es.close();
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => setUnread(0)}
      title="Order notifications"
      className="relative flex size-9 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition hover:bg-accent hover:text-foreground"
    >
      <Bell
        className={cn(
          "size-4 transition-transform",
          ringing && "animate-[wiggle_0.3s_ease-in-out_4]",
        )}
      />
      {unread > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );
}
