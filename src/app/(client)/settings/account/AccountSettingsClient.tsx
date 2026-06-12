"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProfileAction, changePasswordAction, deleteAccountAction } from "./actions";

type ActionState = { error?: string; success?: boolean } | null;

const INDUSTRY_OPTIONS = [
  "Business Consulting",
  "Marketing Agency",
  "Law Firm",
  "Healthcare",
  "Creative Agency",
  "Tech/Software",
  "Real Estate",
  "Financial Services",
  "Education",
  "Other",
];

interface Props {
  email: string;
  fullName: string;
  companyName: string;
  industry: string;
  teamSize: number | null;
  anonymousMode: boolean;
}

export default function AccountSettingsClient({
  email,
  fullName,
  companyName,
  industry,
  teamSize,
  anonymousMode,
}: Props) {
  const [profileState, profileAction, profilePending] = useActionState<ActionState, FormData>(
    updateProfileAction,
    null
  );
  const [passwordState, passwordAction, passwordPending] = useActionState<ActionState, FormData>(
    changePasswordAction,
    null
  );
  const [deleteState, deleteAction, deletePending] = useActionState<ActionState, FormData>(
    deleteAccountAction,
    null
  );

  return (
    <div className="space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
          <CardDescription>
            These details are used to personalise your AI hiring advisor.
          </CardDescription>
        </CardHeader>
        <form action={profileAction}>
          <CardContent className="space-y-4">
            {profileState?.error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {profileState.error}
              </div>
            )}
            {profileState?.success && (
              <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                Profile updated. Your AI advisor will use these details in future sessions.
              </div>
            )}

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">Email cannot be changed here.</p>
            </div>

            {/* Full name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                defaultValue={fullName}
                required
                autoComplete="name"
              />
            </div>

            {/* Company name + anonymous toggle */}
            <div className="space-y-2">
              <Label htmlFor="company_name">
                Company name{" "}
                <span className="text-gray-400 font-normal text-xs">(optional)</span>
              </Label>
              <Input
                id="company_name"
                name="company_name"
                type="text"
                defaultValue={anonymousMode ? "" : companyName}
                placeholder={anonymousMode ? "Kept private" : "e.g. Acme Consulting"}
                disabled={anonymousMode}
                className={anonymousMode ? "bg-gray-50 cursor-not-allowed" : ""}
              />
              <label className="flex items-center gap-2 cursor-pointer select-none mt-1">
                <input
                  type="hidden"
                  name="anonymous_mode"
                  value={anonymousMode ? "true" : "false"}
                  id="anonymous_mode_hidden"
                />
                <AnonymousToggle defaultChecked={anonymousMode} />
                <span className="text-xs text-gray-500">Keep my company name private</span>
              </label>
            </div>

            {/* Industry */}
            <div className="space-y-2">
              <Label htmlFor="industry">
                Industry{" "}
                <span className="text-gray-400 font-normal text-xs">(optional)</span>
              </Label>
              <select
                id="industry"
                name="industry"
                defaultValue={industry}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Select an industry</option>
                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                Helps the AI use industry-specific terminology and role benchmarks.
              </p>
            </div>

            {/* Team size */}
            <div className="space-y-2">
              <Label htmlFor="team_size">
                Current team size{" "}
                <span className="text-gray-400 font-normal text-xs">(optional)</span>
              </Label>
              <Input
                id="team_size"
                name="team_size"
                type="number"
                min="1"
                max="100000"
                defaultValue={teamSize ?? ""}
                placeholder="e.g. 5"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={profilePending}>
              {profilePending ? "Saving..." : "Save changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Change password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <form action={passwordAction}>
          <CardContent className="space-y-4">
            {passwordState?.error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {passwordState.error}
              </div>
            )}
            {passwordState?.success && (
              <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                Password updated successfully.
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="current_password">Current password</Label>
              <Input
                id="current_password"
                name="current_password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password">New password</Label>
              <Input
                id="new_password"
                name="new_password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm new password</Label>
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={passwordPending}>
              {passwordPending ? "Updating..." : "Update password"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Delete account */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-lg text-red-700">Delete account</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <form action={deleteAction}>
          <CardContent className="space-y-4">
            {deleteState?.error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {deleteState.error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="confirmation">
                Type <span className="font-mono font-semibold">DELETE</span> to confirm
              </Label>
              <Input
                id="confirmation"
                name="confirmation"
                type="text"
                required
                placeholder="DELETE"
                className="border-red-300 focus:border-red-500"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" variant="destructive" disabled={deletePending}>
              {deletePending ? "Deleting..." : "Delete my account"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

// Controlled checkbox that also updates the hidden input so the server action
// receives the correct anonymous_mode value on submit.
function AnonymousToggle({ defaultChecked }: { defaultChecked: boolean }) {
  return (
    <input
      type="checkbox"
      defaultChecked={defaultChecked}
      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      onChange={(e) => {
        const hidden = document.getElementById(
          "anonymous_mode_hidden"
        ) as HTMLInputElement | null;
        if (hidden) hidden.value = e.target.checked ? "true" : "false";
        const companyInput = document.getElementById(
          "company_name"
        ) as HTMLInputElement | null;
        if (companyInput) {
          companyInput.disabled = e.target.checked;
          companyInput.placeholder = e.target.checked ? "Kept private" : "e.g. Acme Consulting";
        }
      }}
    />
  );
}
