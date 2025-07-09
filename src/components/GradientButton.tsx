
import React, { useEffect, useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface GradientButtonProps extends ButtonProps {
  children: React.ReactNode;
}

export const GradientButton: React.FC<GradientButtonProps> = ({ 
  children, 
  className, 
  ...props 
}) => {
  const { user } = useAuth();
  const [accentColor, setAccentColor] = useState('#3b82f6');

  useEffect(() => {
    const fetchAccentColor = async () => {
      if (user) {
        const { data } = await supabase
          .from('user_preferences')
          .select('accent_color')
          .eq('user_id', user.id)
          .single();
        
        if (data?.accent_color) {
          setAccentColor(data.accent_color);
        }
      }
    };
    
    fetchAccentColor();
  }, [user]);

  const gradientStyle = {
    background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}44)`,
    border: `2px solid transparent`,
    backgroundClip: 'padding-box',
    position: 'relative' as const,
  };

  const gradientBorderStyle = {
    content: '""',
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 'inherit',
    padding: '2px',
    background: `linear-gradient(135deg, ${accentColor}, ${accentColor}88)`,
    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    maskComposite: 'xor',
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
  };

  return (
    <Button
      {...props}
      className={cn('relative overflow-hidden', className)}
      style={gradientStyle}
    >
      <div style={gradientBorderStyle}></div>
      <span className="relative z-10">{children}</span>
    </Button>
  );
};
