"use client";

import { useState, useTransition } from "react";
import { Loader2, Lock, LockOpen } from "lucide-react";
import { toast } from "sonner";
import { setFoodOrderingEnabledAction } from "@/lib/actions/food";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function OrderingToggle({ initialEnabled }: { readonly initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !enabled;
    startTransition(async () => {
      const result = await setFoodOrderingEnabledAction(next);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setEnabled(result.orderingEnabled ?? next);
      toast.success(next ? "Guests can now place orders." : "Ordering is now closed to guests.");
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-3">
          {enabled ? <LockOpen className="text-primary" /> : <Lock className="text-muted-foreground" />}
          <div>
            <p className="font-medium">Guest ordering is {enabled ? "open" : "closed"}</p>
            <p className="text-sm text-muted-foreground">
              {enabled
                ? "Guests can choose their meal from the welcome page and /food."
                : "The \"Choose Your Meal\" button is locked for guests until you open it."}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant={enabled ? "secondary" : "default"}
          onClick={toggle}
          disabled={isPending}
        >
          {isPending && <Loader2 className="animate-spin" />}
          {enabled ? "Close ordering" : "Open ordering"}
        </Button>
      </CardContent>
    </Card>
  );
}
