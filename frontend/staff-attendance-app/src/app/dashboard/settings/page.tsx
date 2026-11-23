
import { ProfilePictureSettings } from "@/components/settings/profile-picture-settings";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">
          Account settings
        </h1>
        <p className="mt-1 text-sm text-navy-500">
          Manage your personal account and preferences.
        </p>
      </div>

      <ProfilePictureSettings />
    </div>
  );
}
