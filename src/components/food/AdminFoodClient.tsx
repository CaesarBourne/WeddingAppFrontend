"use client";

import { useRef, useState, useTransition } from "react";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  MinusCircle,
  PlusCircle,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteFoodItemAction,
  updateFoodItemAction,
  uploadFoodImageAction,
} from "@/lib/actions/food";
import { buildApiUrl } from "@/lib/api-client";
import { clientEnv } from "@/lib/env-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FoodItemDto, FoodOrderDto } from "@/lib/types";

interface Props {
  readonly initialItems: FoodItemDto[];
  readonly initialOrders: FoodOrderDto[];
}

export function AdminFoodClient({ initialItems, initialOrders }: Props) {
  const [items, setItems] = useState<FoodItemDto[]>(initialItems);
  const [orders] = useState<FoodOrderDto[]>(initialOrders);

  const foods = items.filter((i) => i.category === "food");
  const drinks = items.filter((i) => i.category === "drink");

  function handleItemUpdate(updated: FoodItemDto) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  function handleItemDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Food items */}
      <ItemSection title="Food" items={foods} onUpdate={handleItemUpdate} onDelete={handleItemDelete} />
      {/* Drink items */}
      <ItemSection title="Drinks" items={drinks} onUpdate={handleItemUpdate} onDelete={handleItemDelete} />

      {/* All orders */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">All orders ({orders.length})</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {orders.map((o) => (
              <div
                key={o.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3"
              >
                <Badge variant={o.category === "drink" ? "secondary" : "default"}>
                  {o.category === "drink" ? "🥂 Drink" : "🍽️ Food"}
                </Badge>
                <span className="font-medium">{o.foodItemName}</span>
                <span className="text-sm text-muted-foreground">
                  {o.guestName ?? "Unknown guest"}
                  {o.seatNumber ? ` · Seat ${o.seatNumber}` : ""}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ItemSection({
  title,
  items,
  onUpdate,
  onDelete,
}: {
  readonly title: string;
  readonly items: FoodItemDto[];
  readonly onUpdate: (item: FoodItemDto) => void;
  readonly onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{title} ({items.length})</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No {title.toLowerCase()} items yet — add one above.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <AdminFoodCard key={item.id} item={item} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function AdminFoodCard({
  item,
  onUpdate,
  onDelete,
}: {
  readonly item: FoodItemDto;
  readonly onUpdate: (item: FoodItemDto) => void;
  readonly onDelete: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const imageUrl = item.imageUrl
    ? buildApiUrl(clientEnv.apiBaseUrl, item.imageUrl)
    : null;

  function optimistic(patch: Partial<FoodItemDto>) {
    onUpdate({ ...item, ...patch });
  }

  function run(fn: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const result = await fn();
      if (result.error) {
        toast.error(result.error);
        // Revert by re-fetching would require a router.refresh(); keep it simple
      }
    });
  }

  function toggleAvailable() {
    const next = !item.isAvailable;
    optimistic({ isAvailable: next });
    run(() => updateFoodItemAction(item.id, { isAvailable: next }));
  }

  function adjustPlates(delta: number) {
    const next = Math.max(0, item.availablePlates + delta);
    optimistic({ availablePlates: next });
    run(() => updateFoodItemAction(item.id, { availablePlates: next }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      const result = await uploadFoodImageAction(item.id, fd);
      if (result.error) {
        toast.error(result.error);
      } else {
        // Force browser to reload image from server (cache-busted)
        const base = item.imageUrl ?? `/food/items/${item.id}/image`;
        optimistic({ imageUrl: `${base}?t=${Date.now()}` });
        toast.success("Image updated.");
      }
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleDelete() {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    const result = await deleteFoodItemAction(item.id);
    if (result.error) {
      toast.error(result.error);
      setDeleting(false);
    } else {
      onDelete(item.id);
    }
  }

  return (
    <div className={cn("relative flex flex-col overflow-hidden rounded-xl border bg-card", !item.isAvailable && "opacity-60")}>
      {/* Image area */}
      <div className="relative h-40 w-full bg-muted">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-xs">No image</div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <button
          type="button"
          title="Upload image"
          onClick={() => fileRef.current?.click()}
          className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm hover:bg-black/80"
        >
          <ImagePlus className="size-3" /> Change
        </button>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-3 p-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <span className="font-medium leading-snug">{item.name}</span>
            <Badge variant={item.category === "drink" ? "secondary" : "default"} className="shrink-0">
              {item.category}
            </Badge>
          </div>
          {item.description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
          )}
        </div>

        {/* Plates counter */}
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
          <span className="text-sm text-muted-foreground">Plates left</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustPlates(-1)}
              disabled={isPending || item.availablePlates <= 0}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <MinusCircle className="size-5" />
            </button>
            <span className={cn("w-8 text-center font-semibold tabular-nums", item.availablePlates === 0 && "text-destructive")}>
              {item.availablePlates}
            </span>
            <button
              type="button"
              onClick={() => adjustPlates(1)}
              disabled={isPending}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <PlusCircle className="size-5" />
            </button>
          </div>
          <span className="text-xs text-muted-foreground">/ {item.totalPlates}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant={item.isAvailable ? "secondary" : "default"}
            size="sm"
            className="flex-1"
            onClick={toggleAvailable}
            disabled={isPending}
          >
            {isPending && <Loader2 className="animate-spin" />}
            {!isPending && item.isAvailable && <XCircle className="size-4" />}
            {!isPending && !item.isAvailable && <CheckCircle2 className="size-4" />}
            {item.isAvailable ? "Mark unavailable" : "Mark available"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={deleting}
            className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
            title="Delete item"
          >
            {deleting ? <Loader2 className="animate-spin" /> : <Trash2 className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
