import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QRValidateClient } from "@/components/admin/QRValidateClient";
import { apiFetch } from "@/lib/api-server";
import { requireAdmin } from "@/lib/auth";
import type { UserDto } from "@/lib/types";

export default async function QrValidatePage({
  params,
}: {
  params: Promise<{ guestId: string }>;
}) {
  await requireAdmin();
  const { guestId } = await params;

  const res = await apiFetch(`/users/${guestId}`);
  if (!res.ok) redirect("/admin");
  const guest = (await res.json()) as UserDto;

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-4 border-b p-4">
        <Button
          variant="ghost"
          nativeButton={false}
          render={
            <Link href="/admin">
              <ArrowLeft /> Guest list
            </Link>
          }
        />
        <span className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Entrance Scan
        </span>
      </header>

      <main className="flex justify-center p-8">
        <QRValidateClient
          guestId={guestId}
          name={guest.name ?? "Guest"}
          avatarUrl={guest.avatarUrl}
          admissionStatus={guest.admissionStatus}
          admittedAt={guest.admittedAt}
        />
      </main>
    </div>
  );
}
