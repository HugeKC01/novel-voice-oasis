import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProfileSidebar } from './ProfileSidebar';
import { ApiKeysSettings } from './ApiKeysSettings';

interface Profile {
  username: string;
}

interface UserPreferences {
  accent_color: string;
  dark_mode: boolean;
}

export const ProfileSettings = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState<Profile>({ username: '' });
  const [preferences, setPreferences] = useState<UserPreferences>({ accent_color: '#16a34a', dark_mode: false });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, refreshUserPreferences } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
    fetchPreferences();
  }, [user]);

  useEffect(() => {
    // Apply dark mode immediately for visual feedback
    if (preferences.dark_mode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences.dark_mode]);

  useEffect(() => {
    // Apply accent color to CSS custom properties
    document.documentElement.style.setProperty('--primary', `${hexToHsl(preferences.accent_color)}`);
  }, [preferences.accent_color]);

  const hexToHsl = (hex: string) => {
    // Convert hex to HSL for Tailwind CSS custom properties
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          username: data.username || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          accent_color: data.accent_color || '#16a34a',
          dark_mode: Boolean(data.dark_mode) // Ensure boolean type
        });
      } else {
        // No preferences found, use defaults
        setPreferences({
          accent_color: '#16a34a',
          dark_mode: false
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: profile.username,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // First, check if preferences already exist
      const { data: existingPrefs, error: fetchError } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingPrefs && !fetchError) {
        // Update existing record
        const { error } = await supabase
          .from('user_preferences')
          .update({
            accent_color: preferences.accent_color,
            dark_mode: preferences.dark_mode,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            accent_color: preferences.accent_color,
            dark_mode: preferences.dark_mode,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      // Refresh user preferences to apply changes immediately
      await refreshUserPreferences();

      toast({
        title: "Success",
        description: "Preferences updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.admin.deleteUser(user!.id);
      
      if (error) throw error;

      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Username</label>
                <Input
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input value={user?.email || ''} disabled />
              </div>

              <Button onClick={updateProfile} disabled={loading}>
                Update Profile
              </Button>
            </CardContent>
          </Card>
        );

      case 'api-keys':
        return <ApiKeysSettings />;

      case 'appearance':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Dark Mode</label>
                  <p className="text-xs text-muted-foreground">Toggle dark mode theme</p>
                </div>
                <Switch
                  checked={preferences.dark_mode}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, dark_mode: checked })}
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Accent Color</label>
                  <p className="text-xs text-muted-foreground mb-3">Choose your preferred accent color</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={preferences.accent_color}
                    onChange={(e) => setPreferences({ ...preferences, accent_color: e.target.value })}
                    className="w-12 h-12 rounded-lg border border-input cursor-pointer"
                  />
                  <Input
                    value={preferences.accent_color}
                    onChange={(e) => setPreferences({ ...preferences, accent_color: e.target.value })}
                    placeholder="#16a34a"
                    className="font-mono"
                  />
                </div>

                <div className="grid grid-cols-6 gap-2 mt-4">
                  {['#16a34a', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setPreferences({ ...preferences, accent_color: color })}
                      className="w-8 h-8 rounded-lg border-2 hover:scale-110 transition-transform"
                      style={{ 
                        backgroundColor: color,
                        borderColor: preferences.accent_color === color ? '#000' : 'transparent'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={updatePreferences} disabled={loading}>
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'security':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Confirm Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <Button onClick={updatePassword} disabled={loading}>
                Update Password
              </Button>
            </CardContent>
          </Card>
        );

      case 'danger':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button variant="destructive" onClick={deleteAccount} disabled={loading}>
                Delete Account
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-[600px]">
      <ProfileSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      <div className="flex-1 p-6">
        {renderContent()}
      </div>
    </div>
  );
};
