import Link from "next/link";
import { ArrowLeft, LogOut, QrCode, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateGuestForm } from "@/components/admin/CreateGuestForm";
import { UserRow } from "@/components/admin/UserRow";
import ThemeToggle from "@/components/wedding/ThemeToggle";
import { apiFetch } from "@/lib/api-server";
import { logoutAction } from "@/lib/actions/auth";
import { requireAdmin } from "@/lib/auth";
import { env } from "@/lib/env";
import type { UserDto } from "@/lib/types";

export default async function AdminPage() {
  await requireAdmin();

  const res = await apiFetch("/users");
  const users: UserDto[] = res.ok ? await res.json() : [];
  const guests = users.filter((u) => u.role === "guest");
  const admins = users.filter((u) => u.role !== "guest");

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b p-4">
        <div>
          <p className="font-serif-display text-xl">{env.NEXT_PUBLIC_COUPLE_NAMES}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Guest Management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle scrolled />
          <Button
            variant="ghost"
            nativeButton={false}
            render={
              <Link href="/admin/moderation">
                <ShieldCheck /> Moderation
              </Link>
            }
          />
          <Button
            variant="ghost"
            nativeButton={false}
            render={
              <Link href="/">
                <ArrowLeft /> Site
              </Link>
            }
          />
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="icon" title="Sign out">
              <LogOut />
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="text-primary" /> Invite a guest
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Enter the guest&apos;s name to generate a unique QR code. They scan it to instantly
              sign in and upload photos — no password needed.
            </p>
            <CreateGuestForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="text-primary" /> Guests ({guests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {guests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No guests yet — create one above.</p>
            ) : (
              guests.map((u) => <UserRow key={u.id} user={u} />)
            )}
          </CardContent>
        </Card>

        {admins.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Admin accounts ({admins.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {admins.map((u) => (
                <UserRow key={u.id} user={u} />
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
