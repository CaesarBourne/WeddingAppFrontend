"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2, ShieldPlus } from "lucide-react";
import { toast } from "sonner";
import { createAdminAction } from "@/lib/actions/users";
import type { ActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

export function CreateAdminForm() {
  const [state, formAction, pending] = useActionState(createAdminAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (pending) return;
    if (state === initialState) return;
    if (state.error) {
      toast.error(state.error);
    } else {
      toast.success("Admin account created.");
      formRef.current?.reset();
      setShowPw(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="admin-name">Full name</Label>
          <Input
            id="admin-name"
            name="name"
            type="text"
            placeholder="e.g. Jane Smith"
            maxLength={80}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="admin-email">Email address</Label>
          <Input
            id="admin-email"
            name="email"
            type="email"
            placeholder="jane@example.com"
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="admin-password">Password</Label>
        <div className="relative">
          <Input
            id="admin-password"
            name="password"
            type={showPw ? "text" : "password"}
            placeholder="Minimum 8 characters"
            minLength={8}
            required
            className="pr-10"
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={showPw ? "Hide password" : "Show password"}
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <ShieldPlus />}
          {pending ? "Creating…" : "Create admin"}
        </Button>
      </div>
    </form>
  );
}
