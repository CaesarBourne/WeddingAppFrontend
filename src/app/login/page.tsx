import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { env } from "@/lib/env";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user && isAdmin(user)) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{env.NEXT_PUBLIC_COUPLE_NAMES}</CardTitle>
          <CardDescription>Sign in to manage guests and admissions.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
