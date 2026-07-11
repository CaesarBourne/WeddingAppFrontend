import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GuestAutoLogin } from "@/components/auth/GuestAutoLogin";
import { apiFetch } from "@/lib/api-server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { env } from "@/lib/env";

interface GuestInfo {
  id: string;
}

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const user = await getCurrentUser();

  if (user) {
    if (isAdmin(user) && t) {
      const res = await apiFetch("/auth/guest-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t }),
      });
      if (res.ok) {
        const info = (await res.json()) as GuestInfo;
        redirect(`/admin/qr/${info.id}`);
      }
      redirect("/admin");
    }
    redirect("/welcome");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{env.NEXT_PUBLIC_COUPLE_NAMES}</CardTitle>
          {!t && <CardDescription>Invalid invitation link.</CardDescription>}
        </CardHeader>
        <CardContent>
          {t ? (
            <GuestAutoLogin token={t} />
          ) : (
            <p role="alert" className="text-sm text-destructive">
              This link is invalid — no guest token found. Please scan your QR code again.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
