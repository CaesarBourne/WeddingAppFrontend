"use client";

import { useState } from "react";
import { Loader2, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteGuestAction, toggleGuestButtonAction } from "@/lib/actions/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/admin/UserAvatar";
import { QrCell } from "@/components/admin/QrCell";
import type { UserDto } from "@/lib/types";

export function UserRow({ user }: { user: UserDto }) {
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const isGuest = user.role === "guest";

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
