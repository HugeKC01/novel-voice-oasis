import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Download, Edit, Trash2, Calendar, Settings, Hash, Play } from 'lucide-react';
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
  category: string;
  cover_image_url: string;
  created_at: string;
}

export default function CollectionView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<VoiceCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingCategory, setEditingCategory] = useState('');
  const [editingCoverUrl, setEditingCoverUrl] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCollection();
  }, [id, user]);

  const fetchCollection = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('voice_collections')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCollection(data);
      setEditingTitle(data.title);
      setEditingCategory(data.category);
      setEditingCoverUrl(data.cover_image_url || '');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch collection",
        variant: "destructive",
      });
      navigate('/collections');
    } finally {
      setLoading(false);
    }
  };

  const updateCollection = async () => {
    if (!collection) return;

    try {
      const { error } = await supabase
        .from('voice_collections')
        .update({
          title: editingTitle,
          category: editingCategory,
          cover_image_url: editingCoverUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', collection.id);

      if (error) throw error;

      setCollection({
        ...collection,
        title: editingTitle,
        category: editingCategory,
        cover_image_url: editingCoverUrl
      });

      setShowEditDialog(false);
      toast({
        title: "Success",
        description: "Collection updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update collection",
        variant: "destructive",
      });
    }
  };

  const deleteCollection = async () => {
    if (!collection || !confirm('Are you sure you want to delete this collection?')) return;

    try {
      const { error } = await supabase
        .from('voice_collections')
        .delete()
        .eq('id', collection.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Collection deleted successfully",
      });
      navigate('/collections');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete collection",
        variant: "destructive",
      });
    }
  };

  const downloadAudio = () => {
    if (collection?.audio_url) {
      const link = document.createElement('a');
      link.href = collection.audio_url;
      link.download = `${collection.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const generateSpeechForCollection = async () => {
    if (!collection) return;

    try {
      // Fetch Botnoi API key from Supabase profiles table
      let botnoiToken = '';
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('botnoi_token')
          .eq('id', user.id)
          .single();
        if (error || !data?.botnoi_token) {
          throw new Error('Botnoi API key not found. Please set your API key in settings.');
        }
        botnoiToken = data.botnoi_token;
      } else {
        throw new Error('User not authenticated');
      }

      const response = await supabase.functions.invoke('generate-speech', {
        body: {
          text: collection.original_text.trim(),
          speaker: collection.speaker,
          volume: collection.volume,
          speed: collection.speed,
          language: collection.language,
          type_media: 'mp3',
          botnoiToken,
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { audio_url } = response.data;
      
      // Update the collection with the new audio URL
      const { error: updateError } = await supabase
        .from('voice_collections')
        .update({ audio_url })
        .eq('id', collection.id);

      if (updateError) throw updateError;

      setCollection({ ...collection, audio_url });
      toast({
        title: "Success",
        description: "Speech generated successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate speech",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center py-8">Loading collection...</div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center py-8">Collection not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/collections')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Collections
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="w-full aspect-[3/4] rounded-lg overflow-hidden mb-4">
                    {collection.cover_image_url ? (
                      <img
                        src={collection.cover_image_url}
                        alt={collection.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <div className="text-4xl font-bold text-primary/40">
                          {collection.title.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold mb-2">{collection.title}</h2>
                  <p className="text-sm text-muted-foreground">{collection.category}</p>
                  {!collection.audio_url && (
                    <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded mt-2">
                      Ungenerated Sound
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Created: {new Date(collection.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span>Characters: {collection.original_text.length.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span>Speaker {collection.speaker}</span>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>Volume: {collection.volume}</p>
                    <p>Speed: {collection.speed}x</p>
                    <p>Language: {collection.language === 'th' ? 'Thai' : 'English'}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-6">
                  {!collection.audio_url && (
                    <Button onClick={generateSpeechForCollection} className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Generate Speech
                    </Button>
                  )}
                  
                  <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Info
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Collection</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Title</label>
                          <Input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Category</label>
                          <Select value={editingCategory} onValueChange={setEditingCategory}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Uncategorized">Uncategorized</SelectItem>
                              <SelectItem value="Fiction">Fiction</SelectItem>
                              <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
                              <SelectItem value="Education">Education</SelectItem>
                              <SelectItem value="Business">Business</SelectItem>
                              <SelectItem value="Romance">Romance</SelectItem>
                              <SelectItem value="Mystery">Mystery</SelectItem>
                              <SelectItem value="Sci-Fi">Sci-Fi</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Cover Image URL</label>
                          <Input
                            value={editingCoverUrl}
                            onChange={(e) => setEditingCoverUrl(e.target.value)}
                            placeholder="Enter image URL..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={updateCollection} className="flex-1">Save Changes</Button>
                          <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="destructive" className="w-full" onClick={deleteCollection}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Audio Playback</CardTitle>
              </CardHeader>
              <CardContent>
                {collection.audio_url ? (
                  <div className="space-y-4">
                    <audio controls className="w-full">
                      <source src={collection.audio_url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                    <Button onClick={downloadAudio} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Audio
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No audio file generated yet</p>
                    <Button onClick={generateSpeechForCollection}>
                      <Play className="h-4 w-4 mr-2" />
                      Generate Speech Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Original Text</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto p-4 bg-muted rounded-lg">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {collection.original_text}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
