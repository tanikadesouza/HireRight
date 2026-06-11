"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProfileAction, changePasswordAction, deleteAccountAction } from "./actions";

type ActionState = { error?: string; success?: boolean } | null;

interface Props {
  email: string;
  fullName: string;
}

export default function AccountSettingsClient({ email, fullName }: Props) {
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
      {/* UM-6: Update profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
          <CardDescription>Update your display name</CardDescription>
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
                Profile updated successfully.
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} disabled className="bg-gray-50 cursor-not-allowed" />
              <p className="text-xs text-gray-500">Email cannot be changed here.</p>
            </div>
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
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={profilePending}>
              {profilePending ? "Saving..." : "Save changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* UM-5: Change password */}
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

      {/* UM-7: Delete account */}
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
            <Button
              type="submit"
              variant="destructive"
              disabled={deletePending}
            >
              {deletePending ? "Deleting..." : "Delete my account"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
