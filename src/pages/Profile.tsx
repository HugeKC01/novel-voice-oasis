
import React from 'react';
import { Navbar } from '@/components/Navbar';
import { ProfileSettings } from '@/components/ProfileSettings';

export default function Profile() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <ProfileSettings />
        </div>
      </div>
    </div>
  );
}
