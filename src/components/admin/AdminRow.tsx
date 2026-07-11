"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAdminAction } from "@/lib/actions/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserDto } from "@/lib/types";

interface Props {
  user: UserDto;
  isSelf: boolean;
}

export function AdminRow({ user, isSelf }: Props) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(`Remove admin "${user.name}"? They will lose all access immediately.`)
    )
      return;
    setDeleting(true);
    const result = await deleteAdminAction(user.id);
    if ("error" in result && result.error) {
      toast.error(result.error);
      setDeleting(false);
    } else {
      toast.success(`Removed admin ${user.name}.`);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{user.name || "—"}</span>
          <Badge variant={user.role === "super_admin" ? "default" : "secondary"}>
            {user.role}
          </Badge>
          {isSelf && (
            <span className="text-xs text-muted-foreground">(you)</span>
          )}
        </div>
        {user.email && (
          <span className="text-sm text-muted-foreground">{user.email}</span>
        )}
      </div>

      {!isSelf && user.role !== "super_admin" && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          onClick={handleDelete}
          disabled={deleting}
          title="Remove admin"
        >
          {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
        </Button>
      )}
    </div>
  );
}
