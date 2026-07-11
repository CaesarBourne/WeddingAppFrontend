"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadMyAvatarAction } from "@/lib/actions/users";
import type { ActionState } from "@/lib/actions/auth";
import { avatarUrl } from "@/lib/api-client";
import { clientEnv } from "@/lib/env-client";
import { Button } from "@/components/ui/button";

const initialState: ActionState = {};

function AvatarImage({ userId, cacheKey }: { userId: string; cacheKey: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Camera className="h-8 w-8 text-muted-foreground" />;
  return (
    <img
      src={`${avatarUrl(clientEnv.apiBaseUrl, userId)}?v=${cacheKey}`}
      alt="Your profile photo"
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export function AvatarUpload({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(uploadMyAvatarAction, initialState);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // Bumped inside the file-input event handler (not render/effect), so it's a
  // plain, compiler-safe imperative update that forces <AvatarImage> to remount
  // with a fresh cache-busted src and reset onError state on every attempt.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (state === initialState) return;
    if (state.error) toast.error(state.error);
    else toast.success("Profile photo updated.");
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col items-center gap-3">
      <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border bg-muted">
        <AvatarImage key={attempt} userId={userId} cacheKey={attempt} />
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? <Loader2 className="animate-spin" /> : <Camera />}
        {pending ? "Uploading…" : "Edit photo"}
      </Button>

      <input
        ref={inputRef}
        type="file"
        name="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          if (!e.target.files?.[0]) return;
          setAttempt((a) => a + 1);
          formRef.current?.requestSubmit();
        }}
      />
    </form>
  );
}
