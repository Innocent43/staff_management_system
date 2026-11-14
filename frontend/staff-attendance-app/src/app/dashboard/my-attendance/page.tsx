import { MyAttendance } from "@/components/attendance/my-attendance";

export default function MyAttendancePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-navy-900">My attendance</h1>
      <MyAttendance />
    </div>
  );
}