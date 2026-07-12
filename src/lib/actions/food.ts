"use server";

import { revalidatePath } from "next/cache";
import { parseApiError } from "@/lib/api-client";
import { apiFetch } from "@/lib/api-server";
import type { FoodItemDto, FoodOrderDto } from "@/lib/types";
import type { ActionState } from "@/lib/actions/auth";

// ── Item management (admin) ────────────────────────────────────────────────

export async function createFoodItemAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const category = formData.get("category") as "food" | "drink";
  const totalPlates = Number(formData.get("totalPlates") ?? 0);

  if (!name || !category) return { error: "Name and category are required." };
  if (totalPlates < 1) return { error: "Total plates must be at least 1." };

  const res = await apiFetch("/food/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description, category, totalPlates }),
  });
  if (!res.ok) {
    const err = await parseApiError(res, "Could not create item.");
    return { error: err.message };
  }
  revalidatePath("/admin/food");
  return {};
}

export async function updateFoodItemAction(
  id: string,
  data: { name?: string; description?: string | null; availablePlates?: number; totalPlates?: number; isAvailable?: boolean },
): Promise<{ error?: string }> {
  const res = await apiFetch(`/food/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await parseApiError(res, "Could not update item.");
    return { error: err.message };
  }
  revalidatePath("/admin/food");
  return {};
}

export async function uploadFoodImageAction(
  itemId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const res = await apiFetch(`/food/items/${itemId}/image`, { method: "POST", body: formData });
  if (!res.ok) {
    const err = await parseApiError(res, "Could not upload image.");
    return { error: err.message };
  }
  revalidatePath("/admin/food");
  revalidatePath("/food");
  return {};
}

export async function deleteFoodItemAction(id: string): Promise<{ error?: string }> {
  const res = await apiFetch(`/food/items/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await parseApiError(res, "Could not delete item.");
    return { error: err.message };
  }
  revalidatePath("/admin/food");
  revalidatePath("/food");
  return {};
}

// ── Guest ordering ─────────────────────────────────────────────────────────

export async function placeOrderAction(foodItemId: string): Promise<{ error?: string }> {
  const res = await apiFetch("/food/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ foodItemId }),
  });
  if (!res.ok) {
    const err = await parseApiError(res, "Could not place order.");
    return { error: err.message };
  }
  revalidatePath("/food");
  return {};
}

export async function getMyOrdersAction(): Promise<FoodOrderDto[]> {
  const res = await apiFetch("/food/orders/mine");
  if (!res.ok) return [];
  return (await res.json()) as FoodOrderDto[];
}

// ── Admin: seat number ─────────────────────────────────────────────────────

export async function setSeatNumberAction(
  guestId: string,
  seatNumber: string | null,
): Promise<{ error?: string }> {
  const res = await apiFetch(`/users/guests/${guestId}/seat`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seatNumber }),
  });
  if (!res.ok) {
    const err = await parseApiError(res, "Could not update seat number.");
    return { error: err.message };
  }
  revalidatePath("/admin");
  return {};
}

// ── Admin: all orders ──────────────────────────────────────────────────────

export async function getAllOrdersAction(): Promise<FoodOrderDto[]> {
  const res = await apiFetch("/food/orders");
  if (!res.ok) return [];
  return (await res.json()) as FoodOrderDto[];
}

// ── Shared fetch (server-side for pages) ──────────────────────────────────

export async function getFoodItemsAction(): Promise<FoodItemDto[]> {
  const res = await apiFetch("/food/items");
  if (!res.ok) return [];
  return (await res.json()) as FoodItemDto[];
}
