import { QrClock } from "@/components/attendance/qr-clock";

export default function ScanPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold text-navy-900">Scan to clock in or out</h1>
      <QrClock />
    </div>
  );
}