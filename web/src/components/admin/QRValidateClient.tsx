"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { admitGuestAction } from "@/lib/actions/users";
import { timeAgo } from "@/lib/timeAgo";
import { clientEnv } from "@/lib/env-client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type RingState = "pending" | "just_admitted" | "already_admitted";

interface Props {
  guestId: string;
  name: string;
  avatarUrl: string | null;
  admissionStatus: "pending" | "admitted";
  admittedAt: string | null;
}

export function QRValidateClient({
  guestId,
  name,
  avatarUrl,
  admissionStatus,
  admittedAt: initialAdmittedAt,
}: Props) {
  const [ringState, setRingState] = useState<RingState>(
    admissionStatus === "admitted" ? "already_admitted" : "pending",
  );
  const [admittedAt, setAdmittedAt] = useState(initialAdmittedAt);
  const [admitting, setAdmitting] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const initials = (name || "?").slice(0, 2).toUpperCase();

  async function handleAdmit() {
    if (admitting) return;
    setAdmitting(true);
    const result = await admitGuestAction(guestId);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      setAdmittedAt(result.admittedAt);
      setRingState("just_admitted");
    }
    setAdmitting(false);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div
          className={cn(
            "flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 bg-muted",
            ringState === "just_admitted" && "border-emerald-500",
            ringState === "already_admitted" && "border-destructive",
            ringState === "pending" && "border-border",
          )}
        >
          {avatarUrl && !imgFailed ? (
            <img
              src={`${clientEnv.apiBaseUrl}${avatarUrl}`}
              alt={name}
              className="h-full w-full object-cover"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span className="text-2xl font-medium">{initials}</span>
          )}
        </div>
        {ringState === "just_admitted" && (
          <CheckCircle2 className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-background text-emerald-500" />
        )}
        {ringState === "already_admitted" && (
          <XCircle className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-background text-destructive" />
        )}
      </div>

      <div className="text-center">
        <h2 className="font-serif-display text-2xl">{name}</h2>
        <Badge variant="secondary" className="mt-1">
          Wedding Guest
        </Badge>
      </div>

      {ringState === "pending" && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4 text-sm">
          <Clock className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium">Valid guest — not yet admitted</p>
            <p className="text-muted-foreground">Scan confirmed. Tap below to admit to the event.</p>
          </div>
        </div>
      )}

      {ringState === "just_admitted" && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-500" />
          <div>
            <p className="font-medium">Welcome to the wedding!</p>
            <p className="text-muted-foreground">{name} has been admitted.</p>
          </div>
        </div>
      )}

      {ringState === "already_admitted" && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <XCircle className="h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium">Already admitted</p>
            <p className="text-muted-foreground">
              {admittedAt
                ? `Entered ${timeAgo(admittedAt)} — QR re-use detected.`
                : "This guest has already been admitted to the event."}
            </p>
          </div>
        </div>
      )}

      {ringState === "pending" && (
        <Button onClick={handleAdmit} disabled={admitting} size="lg">
          {admitting ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
          {admitting ? "Admitting…" : "Admit to Event"}
        </Button>
      )}

      {(ringState === "just_admitted" || ringState === "already_admitted") && (
        <Button
          variant="ghost"
          render={
            <Link href="/admin">
              <ArrowLeft /> Back to guest list
            </Link>
          }
        />
      )}
    </div>
  );
}
