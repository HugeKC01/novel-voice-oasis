
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Key } from 'lucide-react';

export const ApiKeysSettings = () => {
  const [botnoiToken, setBotnoiToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchApiKeys();
  }, [user]);

  const fetchApiKeys = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('botnoi_token')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.botnoi_token) {
        setBotnoiToken(data.botnoi_token);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    }
  };

  const saveApiKeys = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          botnoi_token: botnoiToken,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "API keys saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API keys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Botnoi API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="botnoi-token">Botnoi API Token</Label>
            <div className="relative">
              <Input
                id="botnoi-token"
                type={showToken ? "text" : "password"}
                value={botnoiToken}
                onChange={(e) => setBotnoiToken(e.target.value)}
                placeholder="Enter your Botnoi API token"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute inset-y-0 right-0 px-3 py-0 h-full"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your Botnoi API token is required for text-to-speech generation. 
              Get your token from the Botnoi dashboard.
            </p>
          </div>

          <Button onClick={saveApiKeys} disabled={loading}>
            {loading ? "Saving..." : "Save API Keys"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Usage Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Botnoi API:</strong> Used for high-quality text-to-speech generation</p>
            <p><strong>Supported Languages:</strong> Thai (th), English (en)</p>
            <p><strong>Output Formats:</strong> MP3, WAV</p>
            <p className="text-muted-foreground text-xs">
              Your API keys are stored securely and only used for your requests.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
