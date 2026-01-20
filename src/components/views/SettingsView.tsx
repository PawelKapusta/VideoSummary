import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sun, Bell, Shield, UserX, LogOut, EyeOff } from "lucide-react";
import QueryProvider from "../providers/QueryProvider";
import { useProfile } from "@/hooks/useProfile";
import { useLogout } from "@/hooks/useLogout";
import { ApiClientError } from "@/lib/api";
import { toast } from "sonner";
import AppLoader from "@/components/ui/AppLoader";

const SettingsContent = () => {
  const { isLoading, error } = useProfile();
  const { logout, isLoading: isLoggingOut } = useLogout();
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [summaryNotifications, setSummaryNotifications] = useState(true);

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
    if (confirm("Are you sure you want to log out?")) {
      logout();
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data including summaries and subscriptions."
    );

    if (confirmed) {
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
      }
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-6 pt-8 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-800 to-gray-900 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Manage your account preferences, security settings, and customize your experience.
        </p>
      </div>

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
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            variant="outline"
            className="w-full sm:w-auto hover:bg-gray-100 dark:hover:bg-gray-300"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Button>
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
              <Button
                onClick={handleDeleteAccount}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white border-red-600"
              >
                <UserX className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
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
