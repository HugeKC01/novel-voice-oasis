
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar = () => {
  const { user, signOut } = useAuth();

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          Novel Voice
        </Link>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user?.email}
          </span>
          <Link to="/profile">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Profile
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
};
