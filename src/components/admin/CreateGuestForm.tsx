"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { createGuestAction } from "@/lib/actions/users";
import type { ActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: ActionState = {};

export function CreateGuestForm() {
  const [state, formAction, pending] = useActionState(createGuestAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (pending) return;
    if (state === initialState) return;
    if (state.error) toast.error(state.error);
    else {
      toast.success("Guest created.");
      formRef.current?.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap gap-3">
      <Input
        name="name"
        type="text"
        placeholder="Guest name (e.g. Uncle James)"
        maxLength={80}
        required
        className="max-w-xs"
      />
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <UserPlus />}
        {pending ? "Creating…" : "Create & get QR"}
      </Button>
    </form>
  );
}
