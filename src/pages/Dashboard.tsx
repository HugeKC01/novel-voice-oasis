
import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Library, Mic, Settings, Play, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface VoiceCollection {
  id: string;
  title: string;
  category: string;
  cover_image_url: string;
  created_at: string;
}

export default function Dashboard() {
  const [recentCollections, setRecentCollections] = useState<VoiceCollection[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchRecentCollections();
  }, [user]);

  const fetchRecentCollections = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('voice_collections')
        .select('id, title, category, cover_image_url, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentCollections(data || []);
    } catch (error) {
      console.error('Error fetching recent collections:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome to Novel Voice</h1>
          <p className="text-xl text-muted-foreground">Your AI-powered text-to-speech platform</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link to="/text-to-speech">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Mic className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Generate Speech</CardTitle>
                    <CardDescription>Convert text files or direct input to speech</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Upload PDF, Word, or text files, or type directly to generate high-quality voice audio.
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link to="/collections">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <Library className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">My Collections</CardTitle>
                    <CardDescription>Manage your saved voice recordings</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Access, play, and manage all your generated voice collections in one place.
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Recent Collections */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Collections</h2>
            <Link to="/collections">
              <Button variant="outline">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {recentCollections.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No voice collections yet.</p>
                <Link to="/text-to-speech">
                  <Button>
                    <Mic className="h-4 w-4 mr-2" />
                    Create Your First Collection
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {recentCollections.map((collection) => (
                <Card key={collection.id} className="hover:shadow-lg transition-shadow group">
                  <Link to={`/collection/${collection.id}`}>
                    <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
                      {collection.cover_image_url ? (
                        <img
                          src={collection.cover_image_url}
                          alt={collection.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <div className="text-6xl font-bold text-primary/40">
                            {collection.title.charAt(0).toUpperCase()}
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="sm" variant="secondary">
                          <Play className="h-4 w-4 mr-2" />
                          Play
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-2">{collection.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{collection.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(collection.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
