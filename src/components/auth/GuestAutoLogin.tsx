"use client";

import { useActionState, useEffect, useRef } from "react";
import { guestLoginAction, type ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export function GuestAutoLogin({ token }: { token: string }) {
  const [state, formAction] = useActionState(guestLoginAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const tried = useRef(false);

  useEffect(() => {
    if (tried.current) return;
    tried.current = true;
    formRef.current?.requestSubmit();
  }, []);

  if (state.error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {state.error}
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction}>
      <input type="hidden" name="token" value={token} />
      <div className="flex flex-col items-center gap-4 py-8">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    </form>
  );
}
