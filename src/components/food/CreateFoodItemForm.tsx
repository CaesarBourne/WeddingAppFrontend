"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createFoodItemAction } from "@/lib/actions/food";
import type { ActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ActionState = {};

export function CreateFoodItemForm() {
  const [state, action, pending] = useActionState(createFoodItemAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (pending || state === initial) return;
    if (state.error) {
      toast.error(state.error);
    } else {
      toast.success("Item added.");
      formRef.current?.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, pending]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fi-name">Name</Label>
          <Input id="fi-name" name="name" placeholder="e.g. Jollof Rice" maxLength={80} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fi-category">Category</Label>
          <select
            id="fi-category"
            name="category"
            required
            defaultValue=""
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="" disabled>Select…</option>
            <option value="food">Food</option>
            <option value="drink">Drink</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fi-desc">Description (optional)</Label>
          <Input id="fi-desc" name="description" placeholder="Short description" maxLength={160} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fi-plates">Number of plates</Label>
          <Input
            id="fi-plates"
            name="totalPlates"
            type="number"
            min={1}
            max={10000}
            placeholder="e.g. 50"
            required
          />
        </div>
      </div>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Plus />}
          {pending ? "Adding…" : "Add item"}
        </Button>
      </div>
    </form>
  );
}
