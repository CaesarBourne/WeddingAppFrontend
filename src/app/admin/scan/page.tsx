import { QRScannerClient } from "@/components/admin/QRScannerClient";
import { requireAdmin } from "@/lib/auth";

export default async function ScanPage() {
  await requireAdmin();

  // The scanner is entirely client-side (camera + jsQR).
  // Auth is checked server-side here so unauthenticated visitors get a redirect.
  return <QRScannerClient />;
}
