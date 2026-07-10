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

export function AvatarUpload({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(uploadMyAvatarAction, initialState);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [version, setVersion] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    if (pending) return;
    if (state.error) {
      toast.error(state.error);
    } else if (state !== initialState) {
      setVersion((v) => v + 1);
      setImgFailed(false);
      toast.success("Profile photo updated.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col items-center gap-3">
      <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border bg-muted">
        {!imgFailed && (
          <img
            key={version}
            src={`${avatarUrl(clientEnv.apiBaseUrl, userId)}?v=${version}`}
            alt="Your profile photo"
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        )}
        {imgFailed && <Camera className="h-8 w-8 text-muted-foreground" />}
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
        onChange={() => formRef.current?.requestSubmit()}
      />
    </form>
  );
}
