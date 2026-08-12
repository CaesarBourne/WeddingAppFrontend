import Image from "next/image";
import Link from "next/link";
import * as fs from "node:fs";
import * as path from "node:path";
import { ArrowLeft, Home, Lock, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FoodSelectionClient } from "@/components/food/FoodSelectionClient";
import { getFoodOrderingEnabledAction } from "@/lib/actions/food";
import { apiFetch } from "@/lib/api-server";
import { requireUser } from "@/lib/auth";
import { env } from "@/lib/env";
import type { FoodItemDto, FoodOrderDto } from "@/lib/types";

const LOGO_PATH = path.join(process.cwd(), "public", "wedding", "logo.png");

export default async function FoodPage() {
  await requireUser();
  const orderingEnabled = await getFoodOrderingEnabledAction();

  const [itemsRes, ordersRes] = await Promise.all([
    apiFetch("/food/items"),
    apiFetch("/food/orders/mine"),
  ]);

  const items: FoodItemDto[] = itemsRes.ok ? await itemsRes.json() : [];
  const orders: FoodOrderDto[] = ordersRes.ok ? await ordersRes.json() : [];
  const hasLogo = fs.existsSync(LOGO_PATH);

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-4 border-b p-4">
        <Link href="/" aria-label="Back to home" className="shrink-0">
          {hasLogo ? (
            <Image
              src="/wedding/logo.png"
              alt={env.NEXT_PUBLIC_COUPLE_NAMES}
              width={36}
              height={36}
              className="rounded-full object-contain"
            />
          ) : (
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
              <Home className="size-4 text-primary" />
            </div>
          )}
        </Link>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={
            <Link href="/welcome">
              <ArrowLeft /> Back
            </Link>
          }
        />
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <p className="font-serif-display text-lg">{env.NEXT_PUBLIC_COUPLE_NAMES}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Meal Selection</p>
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
            <UtensilsCrossed className="size-7 text-primary" />
          </div>
          <div>
            <h1 className="font-serif-display text-2xl">Choose your meal</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Select your preferred meal and drink for the celebration.
              You can only choose once, so pick your favourite!
            </p>
          </div>
        </div>

        {orderingEnabled ? (
          <FoodSelectionClient items={items} initialOrders={orders} />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border bg-muted/30 py-16 text-center">
            <Lock className="size-8 text-muted-foreground" />
            <p className="font-serif-display text-lg">Meal selection isn&apos;t open yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              The couple will open meal selection on the wedding day. Please check back then.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
