"use client";

import { useState } from "react";
import { Loader2, MapPin, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteGuestAction, toggleGuestButtonAction } from "@/lib/actions/users";
import { setSeatNumberAction } from "@/lib/actions/food";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/admin/UserAvatar";
import { QrCell } from "@/components/admin/QrCell";
import type { UserDto } from "@/lib/types";

export function UserRow({ user }: { readonly user: UserDto }) {
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [editingSeat, setEditingSeat] = useState(false);
  const [seatValue, setSeatValue] = useState(user.seatNumber ?? "");
  const [savingSeat, setSavingSeat] = useState(false);
  const isGuest = user.role === "guest";

  async function handleSaveSeat() {
    setSavingSeat(true);
    const result = await setSeatNumberAction(user.id, seatValue.trim() || null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Seat updated for ${user.name}.`);
      setEditingSeat(false);
    }
    setSavingSeat(false);
  }

  async function handleDelete() {
    if (!confirm(`Remove guest "${user.name}"? This will invalidate their QR code.`)) return;
    setDeleting(true);
    const result = await deleteGuestAction(user.id);
    if ("error" in result) {
      toast.error(result.error);
      setDeleting(false);
    } else {
      toast.success(`Removed ${user.name}.`);
    }
  }

  async function handleToggleButton() {
    setToggling(true);
    const next = !user.buttonEnabled;
    const result = await toggleGuestButtonAction(user.id, next);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success(`Second button ${next ? "enabled" : "disabled"} for ${user.name}.`);
    }
    setToggling(false);
  }

  const ToggleIcon = user.buttonEnabled ? ToggleRight : ToggleLeft;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border p-4">
      <UserAvatar user={user} />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{user.name || "—"}</span>
          <Badge variant="secondary">{user.role}</Badge>
          {isGuest &&
            (user.admissionStatus === "admitted" ? (
              <Badge>Admitted</Badge>
            ) : (
              <Badge variant="outline">Pending</Badge>
            ))}
        </div>
        {user.email && <span className="text-sm text-muted-foreground">{user.email}</span>}
        {isGuest && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            {editingSeat ? (
              <>
                <Input
                  value={seatValue}
                  onChange={(e) => setSeatValue(e.target.value)}
                  placeholder="Seat no."
                  className="h-6 w-24 px-1.5 py-0 text-xs"
                  maxLength={20}
                  onKeyDown={(e) => { if (e.key === "Enter") void handleSaveSeat(); if (e.key === "Escape") setEditingSeat(false); }}
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
                <button type="button" onClick={() => setEditingSeat(false)} className="text-xs hover:underline">Cancel</button>
              </>
            ) : (
              <button type="button" onClick={() => setEditingSeat(true)} className="hover:underline">
                {user.seatNumber ? `Seat ${user.seatNumber}` : "Set seat"}
              </button>
            )}
          </div>
        )}
      </div>

      {isGuest && user.guestToken && <QrCell token={user.guestToken} />}

      {isGuest && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleToggleButton}
            disabled={toggling}
            title={
              user.buttonEnabled ? "Disable guest's second button" : "Enable guest's second button"
            }
          >
            {toggling ? <Loader2 className="animate-spin" /> : <ToggleIcon />}
            {user.buttonEnabled ? "Button on" : "Button off"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={deleting}
            title="Remove guest"
          >
            {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
          </Button>
        </div>
      )}
    </div>
  );
}
