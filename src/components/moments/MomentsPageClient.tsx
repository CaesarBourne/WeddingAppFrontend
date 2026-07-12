"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, Users } from "lucide-react";
import { MomentsGallery } from "@/components/moments/MomentsGallery";
import { GroupedGallery } from "@/components/moments/GroupedGallery";
import { UploadModal } from "@/components/moments/UploadModal";
import { cn } from "@/lib/utils";
import type { PagedPhotos, PhotoDto, AuthUser } from "@/lib/types";

type Tab = "all" | "byGuest";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: <LayoutGrid className="size-3.5" /> },
  { id: "byGuest", label: "By Guest", icon: <Users className="size-3.5" /> },
];

interface Props {
  readonly initial: PagedPhotos | null;
  readonly grouped: PhotoDto[];
  readonly user: AuthUser | null;
}

export function MomentsPageClient({ initial, grouped, user }: Props) {
  const [tab, setTab] = useState<Tab>("all");

  const totalCount =
    tab === "all"
      ? (initial?.meta.total ?? 0)
      : grouped.length;

  return (
    <>
      {/* Upload / sign-in row */}
      <div className="mt-8 flex justify-center">
        {user ? (
          <UploadModal />
        ) : (
          <p className="text-sm text-muted-foreground">
            Invited guest?{" "}
            <Link href="/login" className="text-gold underline underline-offset-4">
              Sign in
            </Link>{" "}
            to add your photos.
          </p>
        )}
      </div>

      {/* Tab switcher */}
      <div className="mt-8 flex items-center justify-between gap-4 border-b pb-4">
        <p className="text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? "photograph" : "photographs"}
        </p>
        <div className="flex gap-1 rounded-full border bg-muted/40 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs uppercase tracking-[0.15em] transition-all",
                tab === t.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mt-8">
        {tab === "all" ? (
          initial ? (
            <MomentsGallery initial={initial} />
          ) : (
            <p className="py-16 text-center text-muted-foreground">
              No memories yet — be the first to share one.
            </p>
          )
        ) : (
          <GroupedGallery photos={grouped} />
        )}
      </div>
    </>
  );
}
