import React from 'react';
import QueryProvider from '../providers/QueryProvider';

const SettingsContent = () => {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="space-y-6">
        <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">Account Settings</h2>
          <p>Manage your profile and preferences here.</p>
        </div>
        <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">Subscription Management</h2>
          <p>View and manage your channel subscriptions.</p>
          {/* TODO: Integrate with SubscriptionSection if needed */}
        </div>
        <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">Privacy & Data</h2>
          <p>Manage your data and privacy settings.</p>
        </div>
      </div>
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
