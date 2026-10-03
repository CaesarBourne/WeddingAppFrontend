"use client";

import { useState } from "react";
import { ListOrdered, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { numberSeatsSequentiallyAction } from "@/lib/actions/food";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NumberSeatsButton({
  groupName,
  guestIds,
  defaultStart,
}: {
  readonly groupName: string;
  /** Guests to number, in the order they should receive seats. */
  readonly guestIds: string[];
  readonly defaultStart: number;
}) {
  const [open, setOpen] = useState(false);
  const [startValue, setStartValue] = useState(String(defaultStart));
  const [saving, setSaving] = useState(false);

  const startAt = Number.parseInt(startValue, 10);
  const isValid = Number.isInteger(startAt) && startAt > 0;

  async function handleApply() {
    if (!isValid) return;
    const lastSeat = startAt + guestIds.length - 1;
    if (!confirm(`Number ${groupName} as seats ${startAt}–${lastSeat}? This replaces their current seat numbers.`)) return;
    setSaving(true);
    const result = await numberSeatsSequentiallyAction(guestIds, startAt);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`${groupName} numbered ${startAt}–${lastSeat}.`);
      setOpen(false);
    }
    setSaving(false);
  }

  if (guestIds.length === 0) return null;

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => { setStartValue(String(defaultStart)); setOpen(true); }}
        title="Give everyone in this group consecutive seat numbers"
      >
        <ListOrdered /> Number seats
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <span>Start at</span>
      <Input
        type="number"
        min={1}
        value={startValue}
        onChange={(e) => setStartValue(e.target.value)}
        className="h-7 w-20 px-1.5 py-0 text-xs"
        onKeyDown={(e) => { if (e.key === "Enter") void handleApply(); if (e.key === "Escape") setOpen(false); }}
        autoFocus
      />
      {isValid && <span className="text-xs">→ {startAt}–{startAt + guestIds.length - 1}</span>}
      <Button type="button" size="sm" onClick={() => void handleApply()} disabled={saving || !isValid}>
        {saving && <Loader2 className="animate-spin" />}
        {saving ? "Numbering…" : "Apply"}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={saving}>
        Cancel
      </Button>
    </div>
  );
}
