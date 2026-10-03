"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { setSeatNumberAction } from "@/lib/actions/food";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { UserDto } from "@/lib/types";

export function SeatGroupMemberRow({ member }: { readonly member: UserDto }) {
  const [editingSeat, setEditingSeat] = useState(false);
  const [seatValue, setSeatValue] = useState(member.seatNumber ?? "");
  const [savingSeat, setSavingSeat] = useState(false);

  async function handleSaveSeat() {
    setSavingSeat(true);
    const result = await setSeatNumberAction(member.id, seatValue.trim() || null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Seat updated for ${member.name}.`);
      setEditingSeat(false);
    }
    setSavingSeat(false);
  }

  function handleCancel() {
    setSeatValue(member.seatNumber ?? "");
    setEditingSeat(false);
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span className="font-medium">
        {member.name || "—"}
        {member.unavailable && (
          <Badge variant="destructive" className="ml-2">
            Not attending
          </Badge>
        )}
      </span>
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <MapPin className="size-3.5 shrink-0" />
        {editingSeat ? (
          <>
            <Input
              value={seatValue}
              onChange={(e) => setSeatValue(e.target.value)}
              placeholder="Seat no."
              className="h-6 w-20 px-1.5 py-0 text-xs"
              maxLength={20}
              onKeyDown={(e) => { if (e.key === "Enter") void handleSaveSeat(); if (e.key === "Escape") handleCancel(); }}
              autoFocus
            />
            <button
              type="button"
              onClick={() => void handleSaveSeat()}
              disabled={savingSeat}
              className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
            >
              {savingSeat ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={handleCancel} className="text-xs hover:underline">Cancel</button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => { setSeatValue(member.seatNumber ?? ""); setEditingSeat(true); }}
            className="hover:underline"
          >
            {member.seatNumber ? `Seat ${member.seatNumber}` : "Set seat"}
          </button>
        )}
      </span>
    </li>
  );
}
