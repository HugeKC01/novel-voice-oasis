
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Trash2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface VoiceCollection {
  id: string;
  title: string;
  original_text: string;
  audio_url: string;
  speaker: string;
  volume: string;
  speed: number;
  language: string;
  created_at: string;
}

export const VoiceCollections = () => {
  const [collections, setCollections] = useState<VoiceCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCollections();
  }, [user]);

  const fetchCollections = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('voice_collections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch voice collections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteCollection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('voice_collections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCollections(collections.filter(c => c.id !== id));
      toast({
        title: "Success",
        description: "Collection deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete collection",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading collections...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">My Voice Collections</h2>
      
      {collections.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No voice collections yet. Create your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {collections.map((collection) => (
            <Card key={collection.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{collection.title}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Play
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteCollection(collection.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(collection.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm">
                    <strong>Settings:</strong> Speaker {collection.speaker}, 
                    Volume {collection.volume}, Speed {collection.speed}x, 
                    Language: {collection.language}
                  </p>
                  <div className="text-sm">
                    <strong>Text Preview:</strong>
                    <p className="mt-1 p-2 bg-muted rounded text-xs max-h-20 overflow-y-auto">
                      {collection.original_text.slice(0, 200)}
                      {collection.original_text.length > 200 && '...'}
                    </p>
                  </div>
                  
                  {collection.audio_url && (
                    <audio controls className="w-full mt-2">
                      <source src={collection.audio_url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
