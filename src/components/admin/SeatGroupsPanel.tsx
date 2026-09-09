"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { createSeatGroupAction, deleteSeatGroupAction } from "@/lib/actions/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SeatGroupDto } from "@/lib/types";

const MAX_GUESTS_PER_SEAT_GROUP = 8;

export function SeatGroupsPanel({ seatGroups }: { readonly seatGroups: SeatGroupDto[] }) {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    const result = await createSeatGroupAction(trimmed);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Seat group "${trimmed}" created.`);
      setName("");
    }
    setCreating(false);
  }

  async function handleDelete(group: SeatGroupDto) {
    if (!confirm(`Delete seat group "${group.name}"? Guests keep their seat number but lose this group.`)) return;
    setDeletingId(group.id);
    const result = await deleteSeatGroupAction(group.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Removed "${group.name}".`);
    }
    setDeletingId(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Group guests under a shared seat name (e.g. &quot;Groomsmen&quot;) — up to {MAX_GUESTS_PER_SEAT_GROUP} guests
        per group. Assign guests to a group from the guest list below.
      </p>

      <div className="flex flex-wrap gap-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seat group name (e.g. Groomsmen)"
          maxLength={40}
          className="max-w-xs"
          onKeyDown={(e) => { if (e.key === "Enter") void handleCreate(); }}
        />
        <Button type="button" onClick={() => void handleCreate()} disabled={creating || !name.trim()}>
          {creating ? <Loader2 className="animate-spin" /> : <Plus />}
          {creating ? "Creating…" : "Add seat group"}
        </Button>
      </div>

      {seatGroups.length > 0 && (
        <div className="flex flex-col gap-2">
          {seatGroups.map((group) => (
            <div key={group.id} className="flex items-center gap-3 rounded-lg border p-3">
              <Users className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate font-medium">{group.name}</span>
              <Badge variant={group.guestCount >= MAX_GUESTS_PER_SEAT_GROUP ? "default" : "secondary"}>
                {group.guestCount}/{MAX_GUESTS_PER_SEAT_GROUP}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void handleDelete(group)}
                disabled={deletingId === group.id}
                title="Delete seat group"
              >
                {deletingId === group.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
