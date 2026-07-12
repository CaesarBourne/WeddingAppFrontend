"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, UtensilsCrossed, Wine } from "lucide-react";
import { toast } from "sonner";
import { placeOrderAction } from "@/lib/actions/food";
import { buildApiUrl } from "@/lib/api-client";
import { clientEnv } from "@/lib/env-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FoodItemDto, FoodOrderDto } from "@/lib/types";

interface Props {
  readonly items: FoodItemDto[];
  readonly initialOrders: FoodOrderDto[];
}

export function FoodSelectionClient({ items, initialOrders }: Props) {
  const foods = items.filter((i) => i.category === "food" && i.isAvailable);
  const drinks = items.filter((i) => i.category === "drink" && i.isAvailable);

  const [orders, setOrders] = useState<FoodOrderDto[]>(initialOrders);
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [selectedDrink, setSelectedDrink] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const orderedFood = orders.find((o) => o.category === "food");
  const orderedDrink = orders.find((o) => o.category === "drink");

  async function handleSubmit() {
    if (!selectedFood && !selectedDrink) {
      toast.error("Please select at least one item.");
      return;
    }
    startTransition(async () => {
      const toOrder: string[] = [];
      if (selectedFood && !orderedFood) toOrder.push(selectedFood);
      if (selectedDrink && !orderedDrink) toOrder.push(selectedDrink);

      for (const id of toOrder) {
        const result = await placeOrderAction(id);
        if (result.error) {
          toast.error(result.error);
          return;
        }
      }

      // Optimistically update local state so the page reflects the choice immediately
      const newOrders = [...orders];
      for (const id of toOrder) {
        const item = items.find((i) => i.id === id);
        if (item) {
          newOrders.push({
            id: crypto.randomUUID(),
            userId: "",
            guestName: null,
            seatNumber: null,
            foodItemId: id,
            foodItemName: item.name,
            category: item.category,
            createdAt: new Date().toISOString(),
          });
        }
      }
      setOrders(newOrders);
      setSelectedFood(null);
      setSelectedDrink(null);
      toast.success("Your selections have been saved!");
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Food section */}
      <Section
        title="Your Meal"
        icon={<UtensilsCrossed className="size-5 text-primary" />}
        completed={!!orderedFood}
        completedLabel={`You chose: ${orderedFood?.foodItemName}`}
      >
        {foods.length === 0 ? (
          <p className="text-sm text-muted-foreground">No food options available yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {foods.map((item) => (
              <FoodCard
                key={item.id}
                item={item}
                selected={selectedFood === item.id}
                onSelect={() => setSelectedFood((v) => (v === item.id ? null : item.id))}
                disabled={!!orderedFood}
              />
            ))}
          </div>
        )}
      </Section>

      {/* Drink section */}
      <Section
        title="Your Drink"
        icon={<Wine className="size-5 text-primary" />}
        completed={!!orderedDrink}
        completedLabel={`You chose: ${orderedDrink?.foodItemName}`}
      >
        {drinks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No drink options available yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {drinks.map((item) => (
              <FoodCard
                key={item.id}
                item={item}
                selected={selectedDrink === item.id}
                onSelect={() => setSelectedDrink((v) => (v === item.id ? null : item.id))}
                disabled={!!orderedDrink}
              />
            ))}
          </div>
        )}
      </Section>

      {/* Submit */}
      {(!orderedFood || !orderedDrink) && (
        <div className="flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={isPending || (!selectedFood && !selectedDrink)}
            className="min-w-40"
          >
            {isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
            {isPending ? "Submitting…" : "Confirm selection"}
          </Button>
        </div>
      )}

      {orderedFood && orderedDrink && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 p-5 text-center dark:bg-emerald-950/30">
          <CheckCircle2 className="mx-auto mb-2 size-8 text-emerald-500" />
          <p className="font-medium text-emerald-700 dark:text-emerald-300">
            All done — enjoy the celebration!
          </p>
          <p className="mt-1 text-sm text-emerald-600/80 dark:text-emerald-400/80">
            Your meal and drink choices have been confirmed.
          </p>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  children,
  completed,
  completedLabel,
}: {
  readonly title: string;
  readonly icon: React.ReactNode;
  readonly children: React.ReactNode;
  readonly completed: boolean;
  readonly completedLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
        {completed && <Badge className="bg-emerald-500 text-white">Confirmed</Badge>}
      </div>
      {completed && completedLabel ? (
        <p className="rounded-lg border border-emerald-500/20 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
          {completedLabel}
        </p>
      ) : (
        children
      )}
    </div>
  );
}

function FoodCard({
  item,
  selected,
  onSelect,
  disabled,
}: {
  readonly item: FoodItemDto;
  readonly selected: boolean;
  readonly onSelect: () => void;
  readonly disabled: boolean;
}) {
  const imageUrl = item.imageUrl
    ? buildApiUrl(clientEnv.apiBaseUrl, item.imageUrl)
    : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
          : "border-border bg-card hover:border-primary/40 hover:bg-accent/40",
        disabled && "cursor-default opacity-60",
      )}
    >
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={item.name}
          className="h-36 w-full object-cover"
        />
      )}
      <div className="flex flex-col gap-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium leading-snug">{item.name}</span>
          {selected && <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground">{item.description}</p>
        )}
      </div>
    </button>
  );
}
