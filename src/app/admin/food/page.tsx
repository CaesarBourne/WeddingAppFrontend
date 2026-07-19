import Link from "next/link";
import { ArrowLeft, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminFoodClient } from "@/components/food/AdminFoodClient";
import { AdminNotificationBell } from "@/components/food/AdminNotificationBell";
import { CreateFoodItemForm } from "@/components/food/CreateFoodItemForm";
import { apiFetch } from "@/lib/api-server";
import { requireAdmin } from "@/lib/auth";
import type { FoodItemDto, FoodOrderDto, UserDto } from "@/lib/types";

export default async function AdminFoodPage() {
  await requireAdmin();

  const [itemsRes, ordersRes, usersRes] = await Promise.all([
    apiFetch("/food/items"),
    apiFetch("/food/orders"),
    apiFetch("/users"),
  ]);

  const items: FoodItemDto[] = itemsRes.ok ? await itemsRes.json() : [];
  const orders: FoodOrderDto[] = ordersRes.ok ? await ordersRes.json() : [];
  const users: UserDto[] = usersRes.ok ? await usersRes.json() : [];
  const guests = users.filter((u) => u.role === "guest");

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={
              <Link href="/admin">
                <ArrowLeft /> Admin
              </Link>
            }
          />
          <div>
            <p className="font-serif-display text-lg">Food & Drinks</p>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Menu management
            </p>
          </div>
        </div>

        {/* Bell subscribes to SSE — must be a client component */}
        <AdminNotificationBell />
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
        {/* Add item */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="text-primary" /> Add menu item
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CreateFoodItemForm />
          </CardContent>
        </Card>

        {/* Manage items + view orders */}
        <AdminFoodClient initialItems={items} initialOrders={orders} guests={guests} />
      </main>
    </div>
  );
}
