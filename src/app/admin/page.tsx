import Link from "next/link";
import { ArrowLeft, LogOut, QrCode, ScanLine, ShieldCheck, ShieldPlus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateGuestForm } from "@/components/admin/CreateGuestForm";
import { CreateAdminForm } from "@/components/admin/CreateAdminForm";
import { AdminRow } from "@/components/admin/AdminRow";
import { UserRow } from "@/components/admin/UserRow";
import ThemeToggle from "@/components/wedding/ThemeToggle";
import { apiFetch } from "@/lib/api-server";
import { logoutAction } from "@/lib/actions/auth";
import { getCurrentUser, requireAdmin, isSuperAdmin } from "@/lib/auth";
import { env } from "@/lib/env";
import type { UserDto } from "@/lib/types";

export default async function AdminPage() {
  await requireAdmin();

  const [meRes, usersRes] = await Promise.all([
    apiFetch("/auth/me"),
    apiFetch("/users"),
  ]);

  const meRaw = meRes.ok ? ((await meRes.json()) as { sub: string; id?: string }) : null;
  const meId = meRaw?.sub ?? meRaw?.id ?? null;

  const users: UserDto[] = usersRes.ok ? await usersRes.json() : [];
  const guests = users.filter((u) => u.role === "guest");
  const adminAccounts = users.filter((u) => u.role === "admin" || u.role === "super_admin");

  // Re-derive super_admin status from the session for conditional UI
  const me = await getCurrentUser();
  const superAdmin = isSuperAdmin(me);

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

          {/* Scan QR — primary CTA for entrance staff */}
          <Button
            nativeButton={false}
            render={
              <Link href="/admin/scan">
                <ScanLine /> Scan QR
              </Link>
            }
          />

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
        {/* Create guest */}
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

        {/* Guest list */}
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

        {/* Admin management — super_admin only */}
        {superAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldPlus className="text-primary" /> Admin accounts ({adminAccounts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  Admin accounts can manage guests and scan QR codes at the entrance. Only you
                  (super admin) can create or remove them.
                </p>
                <CreateAdminForm />
              </div>

              {adminAccounts.length > 0 && (
                <div className="flex flex-col gap-3 border-t pt-4">
                  {adminAccounts.map((u) => (
                    <AdminRow key={u.id} user={u} isSelf={u.id === meId} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
