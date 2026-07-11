"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadUserAvatarAction } from "@/lib/actions/users";
import { avatarUrl } from "@/lib/api-client";
import { clientEnv } from "@/lib/env-client";
import type { UserDto } from "@/lib/types";

export function UserAvatar({ user }: { user: UserDto }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [version, setVersion] = useState(0);
  const initials = (user.name || "?").slice(0, 2).toUpperCase();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadUserAvatarAction(user.id, formData);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      setImgFailed(false);
      setVersion((v) => v + 1);
      toast.success(`Avatar updated for ${user.name}.`);
    }
    setUploading(false);
    e.target.value = "";
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !uploading && inputRef.current?.click()}
        title="Click to change photo"
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border bg-muted text-xs font-medium"
      >
        {user.avatarUrl && !imgFailed ? (
          <img
            key={version}
            src={`${avatarUrl(clientEnv.apiBaseUrl, user.id)}?v=${version}`}
            alt={user.name}
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          initials
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
