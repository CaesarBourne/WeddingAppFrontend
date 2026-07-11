import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModerationCard } from "@/components/admin/ModerationCard";
import { apiFetch } from "@/lib/api-server";
import { requireAdmin } from "@/lib/auth";
import type { PhotoDto } from "@/lib/types";

type Status = "pending" | "approved" | "rejected";
const TABS: { id: Status; label: string }[] = [
  { id: "pending", label: "Awaiting Review" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status: raw } = await searchParams;
  const status: Status = TABS.some((t) => t.id === raw) ? (raw as Status) : "pending";

  const res = await apiFetch("/photos/moderation", { params: { status } });
  const items: PhotoDto[] = res.ok ? await res.json() : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-primary" />
          <div>
            <p className="font-serif-display text-xl">Moderation</p>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Review guest uploads
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          nativeButton={false}
          render={
            <Link href="/admin">
              <ArrowLeft /> Guests
            </Link>
          }
        />
      </header>

      <main className="mx-auto max-w-5xl p-6">
        <div className="mb-8 flex gap-1 border-b">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={`/admin/moderation?status=${t.id}`}
              className={`px-5 py-3 text-xs uppercase tracking-[0.2em] transition-colors ${
                status === t.id
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {items.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">
            {status === "pending"
              ? "All caught up — nothing waiting for review."
              : `Nothing ${status} yet.`}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <ModerationCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
