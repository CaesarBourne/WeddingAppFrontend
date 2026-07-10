import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>{env.NEXT_PUBLIC_COUPLE_NAMES}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground">{env.NEXT_PUBLIC_TAGLINE}</p>
          <p className="text-sm text-muted-foreground">{env.NEXT_PUBLIC_WEDDING_DATE}</p>
          <Button>Scaffold ready — Phase 1 builds the real site here</Button>
        </CardContent>
      </Card>
    </main>
  );
}
