
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { User, Key, Palette, Shield, Trash2 } from 'lucide-react';

interface ProfileSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const ProfileSidebar = ({ activeSection, onSectionChange }: ProfileSidebarProps) => {
  const sections = [
    {
      id: 'profile',
      label: 'Profile Info',
      icon: User,
      description: 'Basic profile settings'
    },
    {
      id: 'api-keys',
      label: 'API Keys',
      icon: Key,
      description: 'Manage your API keys'
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: Palette,
      description: 'Theme and display'
    },
    {
      id: 'security',
      label: 'Security',
      icon: Shield,
      description: 'Password and security'
    },
    {
      id: 'danger',
      label: 'Danger Zone',
      icon: Trash2,
      description: 'Account deletion'
    }
  ];

  return (
    <div className="w-64 bg-card border-r p-4 space-y-2">
      <h3 className="font-semibold text-lg mb-4">Settings</h3>
      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <Button
            key={section.id}
            variant={activeSection === section.id ? "default" : "ghost"}
            className={cn(
              "w-full justify-start h-auto p-3 text-left",
              activeSection === section.id && "bg-primary text-primary-foreground"
            )}
            onClick={() => onSectionChange(section.id)}
          >
            <div className="flex items-start gap-3">
              <Icon className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{section.label}</div>
                <div className={cn(
                  "text-xs opacity-70",
                  activeSection === section.id ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {section.description}
                </div>
              </div>
            </div>
          </Button>
        );
      })}
    </div>
  );
};
