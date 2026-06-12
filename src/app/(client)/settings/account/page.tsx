import { getCurrentProfile } from "@/lib/services/users";
import { redirect } from "next/navigation";
import AccountSettingsClient from "./AccountSettingsClient";

export default async function AccountSettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <main className="max-w-2xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="mt-1 text-gray-600 text-sm">Manage your profile and security settings</p>
      </div>
      <AccountSettingsClient
        email={profile.email ?? ""}
        fullName={profile.full_name ?? ""}
        companyName={profile.company_name ?? ""}
        industry={profile.industry ?? ""}
        teamSize={profile.team_size ?? null}
        anonymousMode={profile.anonymous_mode ?? false}
      />
    </main>
  );
}
