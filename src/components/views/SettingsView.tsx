import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sun, Bell, Shield, UserX, LogOut, EyeOff, User, Save, X } from "lucide-react";
import QueryProvider from "../providers/QueryProvider";
import { useProfile } from "@/hooks/useProfile";
import { useLogout } from "@/hooks/useLogout";
import { ApiClientError } from "@/lib/api";
import { toast } from "sonner";
import AppLoader from "@/components/ui/AppLoader";

const SettingsContent = () => {
  const { profile, isLoading, error, updateProfileAsync, isUpdating } = useProfile();
  const { logout, isLoading: isLoggingOut } = useLogout();
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [summaryNotifications, setSummaryNotifications] = useState(true);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [username, setUsername] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);

  useEffect(() => {
    setUsername(profile?.username || "");
  }, [profile]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <AppLoader loadingText="Loading settings..." />
      </div>
    );
  }

  if (error) {
    let errorMessage = "An unexpected error occurred.";
    if (error instanceof ApiClientError) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return (
      <div className="container max-w-4xl mx-auto p-4 md:p-6 text-center">
        <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive">
          <p className="font-semibold mb-2">Could not load settings.</p>
          <p className="text-sm mb-4">{errorMessage}</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
  };

  const handleSaveUsername = async () => {
    const trimmedUsername = username.trim();
    const finalUsername = trimmedUsername === "" ? undefined : trimmedUsername;
    try {
      await updateProfileAsync({ username: finalUsername });
      // Update local state immediately to reflect the saved value
      setUsername(trimmedUsername);
      setIsEditingUsername(false);
    } catch (error) {
      // Error is handled by the hook, don't exit editing mode on error
      console.error("Failed to save username:", error);
    }
  };

  const handleCancelEdit = () => {
    // Reset to current profile username
    setUsername(profile?.username || "");
    setIsEditingUsername(false);
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Your account has been successfully deleted. You will be redirected to the login page.");
        // Redirect to login page after a short delay
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        toast.error(data.error?.message || "Failed to delete your account. Please try again or contact support.");
      }
    } catch {
      toast.error("An unexpected error occurred while deleting your account. Please try again or contact support.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div data-testid="settings-view" className="container max-w-4xl mx-auto p-4 md:p-6 pt-8 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-800 to-gray-900 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Manage your account preferences, security settings, and customize your experience.
        </p>
      </div>

      {/* Profile Settings */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Manage your public profile and display name.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">
              Username (optional)
            </Label>
            <div className="flex items-center gap-2">
              {isEditingUsername ? (
                <>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="flex-1"
                    disabled={isUpdating}
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveUsername}
                    disabled={isUpdating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex-1 p-3 border rounded-md bg-gray-50 text-sm">
                    {profile?.username || "No username set"}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditingUsername(true)}
                  >
                    Edit
                  </Button>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Your username will be displayed instead of your email. Leave empty to use your email address.
              Username must be 3-30 characters long and can only contain letters, numbers, underscores, and dashes.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Email</Label>
            <div className="p-3 border rounded-md bg-gray-50 text-sm">
              {profile?.email || "Loading..."}
            </div>
            <p className="text-xs text-muted-foreground">
              Your email address cannot be changed here. Contact support if you need to update your email.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Actions
          </CardTitle>
          <CardDescription>Manage your account session and security.</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                disabled={isLoggingOut}
                variant="outline"
                className="w-full sm:w-auto hover:bg-gray-100 dark:hover:bg-gray-300"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-xl">Logout from Account</DialogTitle>
                <DialogDescription className="pt-2 text-base">
                  Are you sure you want to log out? You will need to sign in again to access your account.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0 mt-4">
                <DialogClose>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Appearance
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">Coming Soon</span>
          </CardTitle>
          <CardDescription>Customize how the application looks and feels.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between opacity-50">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
            </div>
            <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} disabled />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">Coming Soon</span>
          </CardTitle>
          <CardDescription>Configure how you receive notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between opacity-50">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive email updates about your account</p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              disabled
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between opacity-50">
            <div className="space-y-0.5">
              <Label htmlFor="summary-notifications">Summary Notifications</Label>
              <p className="text-sm text-muted-foreground">Get notified when new summaries are available</p>
            </div>
            <Switch
              id="summary-notifications"
              checked={summaryNotifications}
              onCheckedChange={setSummaryNotifications}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EyeOff className="h-5 w-5" />
            Hidden Content
          </CardTitle>
          <CardDescription>Manage content you have hidden from your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="space-y-1">
              <p className="font-medium">Hidden Summaries</p>
              <p className="text-sm text-muted-foreground">View and restore summaries you have hidden</p>
            </div>
            <Button variant="outline" onClick={() => (window.location.href = "/hidden")}>
              Manage Hidden
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Data
          </CardTitle>
          <CardDescription>Control your data and privacy preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Data Usage</h4>
            <p className="text-sm text-muted-foreground">
              Your email address is used only for account authentication and password recovery. We don&apos;t share your
              personal information with third parties.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <UserX className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions that will permanently affect your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
              <h4 className="font-medium mb-2 text-destructive">Delete Account</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white border-red-600">
                    <UserX className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl text-destructive">Delete Account</DialogTitle>
                    <DialogDescription className="pt-2 text-base">
                      Are you sure you want to delete your account? This action cannot be undone and will permanently
                      delete all your data including summaries and subscriptions.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2 sm:gap-0 mt-4">
                    <DialogClose>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={isDeletingAccount}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isDeletingAccount ? "Deleting..." : "Delete Account"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function SettingsView() {
  return (
    <QueryProvider>
      <SettingsContent />
    </QueryProvider>
  );
}
