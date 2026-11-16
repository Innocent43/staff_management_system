// "use client";

// import { useState } from "react";
// import dynamic from "next/dynamic";
// import { CheckCircle2 } from "lucide-react";
// import { useRef} from "react";
// import { useRouter } from "next/navigation";

// import { Alert } from "../ui/alert";
// import { Button } from "../ui/button";
// import { ErrorState } from "../ui/error-state";
// import { Skeleton } from "../ui/skeleton";
// import { useMyStatus } from "@/hooks/use-attendance";
// import { useClock } from "@/hooks/use-attendance-mutations";
// import { useBusinessTimezone } from "@/hooks/use-business-timezone";
// import { getErrorMessage } from "@/lib/errors";
// import { formatTime } from "@/lib/format";

// // The camera exists only in the browser, never on the server that pre-renders
// // pages. ssr: false tells Next.js to load this component in the browser only.
// const Scanner = dynamic(
//   () => import("@yudiel/react-qr-scanner").then((module) => module.Scanner),
//   { ssr: false, loading: () => <Skeleton className="aspect-square w-full" /> },
// );

// export function QrClock() {
//   const router = useRouter()
//   const timeZone = useBusinessTimezone();
//   const status = useMyStatus();
//   const clock = useClock();
//   const [cameraError, setCameraError] = useState<string | null>(null);

//     //  3. Synchronous lock that blocks duplicate frames instantly
//   const scanLock = useRef(false)

//   if (status.error) {
//     return <ErrorState message={status.error.message} onRetry={() => status.refetch()} />;
//   }
//   if (status.isPending) return <Skeleton className="h-72 w-full" />;

//   // The app decides the direction: clocked in already means this scan is a clock out
//   const eventType = status.data.clocked_in ? "clock_out" : "clock_in";

//   function handleScan(text: string | undefined) {
//     // ignore empty reads, and ignore scans while a request is running or has finished
//     if (!text || scanLock.current || clock.isPending || clock.isSuccess || clock.isError) return;

//     scanLock.current = true

//     clock.mutate({
//       qr_token: text,
//       event_type: eventType,
//       request_id: crypto.randomUUID(), // a fresh unique id for THIS attempt
//     });
//   }

//   function handleReset(){
//     scanLock.current = false  // Unlock only when user explicitly clicks "Scan again"
//     clock.reset()

//   }

//   if (clock.isSuccess) {
//     return (
//       <div className="space-y-4 rounded-xl border border-navy-200 bg-white p-8 text-center">
//         <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
//         <p className="text-lg font-semibold text-navy-900">
//           {clock.data.event_type === "clock_in" ? "Clocked in" : "Clocked out"}
//         </p>
//         <p className="text-navy-600">{formatTime(clock.data.occurred_at, timeZone)}</p>
//         <Button onClick={() => router.push("/dashboard")}>Done</Button>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4">
//       <p className="text-sm text-navy-600">
//         You are about to clock <b>{eventType === "clock_in" ? "in" : "out"}</b>. Point the
//         camera at the workplace QR code.
//       </p>

//       {clock.error && <Alert>{getErrorMessage(clock.error)}</Alert>}
//       {cameraError && <Alert>{cameraError}</Alert>}

//       <div className="overflow-hidden rounded-xl border border-navy-200">
//         <Scanner
//           formats={["qr_code"]}
//           paused={clock.isPending || clock.isError}
//           onScan={(codes) => handleScan(codes[0]?.rawValue)}
//           onError={() =>
//             setCameraError("Cannot open the camera. Allow camera access in your browser.")
//           }
//         />
//       </div>

//       {clock.isPending && <p className="text-sm text-navy-500">Sending...</p>}
//       {clock.isError && <Button onClick={handleReset}>Scan again</Button>}
//     </div>
//   );
// }










"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { CheckCircle2, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { ErrorState } from "../ui/error-state";
import { Skeleton } from "../ui/skeleton";
import { useMyStatus } from "@/hooks/use-attendance";
import { useClock } from "@/hooks/use-attendance-mutations";
import { useBusinessTimezone } from "@/hooks/use-business-timezone";
import { getDeviceLocation } from "@/lib/geolocation";
import { getErrorMessage } from "@/lib/errors";
import { formatTime } from "@/lib/format";

const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((module) => module.Scanner),
  { ssr: false, loading: () => <Skeleton className="aspect-square w-full" /> },
);

export function QrClock() {
  const router = useRouter();
  const timeZone = useBusinessTimezone();
  const status = useMyStatus();
  const clock = useClock();

  const scanLock = useRef(false);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  if (status.error) {
    return (
      <ErrorState
        message={status.error.message}
        onRetry={() => status.refetch()}
      />
    );
  }

  if (status.isPending) {
    return <Skeleton className="h-72 w-full" />;
  }

  const eventType = status.data.clocked_in ? "clock_out" : "clock_in";

  async function handleScan(text: string | undefined) {
    if (
      !text ||
      scanLock.current ||
      clock.isPending ||
      clock.isSuccess ||
      clock.isError
    ) {
      return;
    }

    scanLock.current = true;
    setGettingLocation(true);
    setLocationError(null);

    try {
      const location = await getDeviceLocation();

      clock.mutate({
        qr_token: text,
        event_type: eventType,
        request_id: crypto.randomUUID(),
        ...location,
      });
    } catch (error) {
      setLocationError(
        error instanceof Error
          ? error.message
          : "Unable to get your location. Please try again.",
      );

      scanLock.current = false;
    } finally {
      setGettingLocation(false);
    }
  }

  function handleReset() {
    scanLock.current = false;
    setLocationError(null);
    setCameraError(null);
    clock.reset();
  }

  if (clock.isSuccess) {
    return (
      <div className="space-y-4 rounded-xl border border-line bg-white p-6 text-center sm:p-8">
        <CheckCircle2 className="mx-auto size-12 text-success-600" />

        <p className="text-lg font-semibold text-ink">
          {clock.data.event_type === "clock_in" ? "Clocked in" : "Clocked out"}
        </p>

        <p className="text-ink-secondary">
          {formatTime(clock.data.occurred_at, timeZone)}
        </p>

        <Button onClick={() => router.push("/dashboard")}>Done</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-base text-ink-secondary">
        You are about to clock{" "}
        <b>{eventType === "clock_in" ? "in" : "out"}</b>. Point your camera at
        the workplace QR code.
      </p>

      {clock.error && <Alert>{getErrorMessage(clock.error)}</Alert>}

      {cameraError && <Alert>{cameraError}</Alert>}

      {locationError && <Alert>{locationError}</Alert>}

      <div className="overflow-hidden rounded-xl border border-line">
        <Scanner
          formats={["qr_code"]}
          paused={gettingLocation || clock.isPending || clock.isError}
          onScan={(codes) => handleScan(codes[0]?.rawValue)}
          onError={() =>
            setCameraError(
              "Cannot open the camera. Allow camera access in your browser.",
            )
          }
        />
      </div>

      {gettingLocation && (
        <div className="flex items-center gap-2 rounded-lg bg-brand-50 p-3 text-sm text-brand-800">
          <MapPin className="size-5 shrink-0" />
          Getting your location...
        </div>
      )}

      {clock.isPending && (
        <p className="text-sm text-ink-secondary">Verifying attendance...</p>
      )}

      {clock.isError && (
        <Button onClick={handleReset}>Scan again</Button>
      )}

      {locationError && (
        <Button onClick={handleReset}>Try again</Button>
      )}
    </div>
  );
}