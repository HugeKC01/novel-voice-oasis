
import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Play, Trash2, Search, Filter, Grid, List, Edit3, X, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';

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
  book_series?: string;
}

export default function Collections() {
  const [collections, setCollections] = useState<VoiceCollection[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<VoiceCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeries, setSelectedSeries] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('created_at');
  const [editMode, setEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [groupBySeries, setGroupBySeries] = useState(false);
  const [expandedSeries, setExpandedSeries] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCollections();
  }, [user]);

  useEffect(() => {
    filterAndSortCollections();
  }, [collections, searchTerm, selectedCategory, selectedSeries, sortBy]);

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

  const filterAndSortCollections = () => {
    let filtered = collections;

    // Filter by search term (including book series)
    if (searchTerm) {
      filtered = filtered.filter(collection =>
        collection.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collection.original_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collection.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (collection.book_series && collection.book_series.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(collection => collection.category === selectedCategory);
    }

    // Filter by series
    if (selectedSeries !== 'all') {
      filtered = filtered.filter(collection => collection.book_series === selectedSeries);
    }

    // Sort collections
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'series':
          return (a.book_series || '').localeCompare(b.book_series || '');
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredCollections(filtered);
  };

  const deleteCollection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return;

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

  const deleteSelectedCollections = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedItems.length} collections?`)) return;

    try {
      const { error } = await supabase
        .from('voice_collections')
        .delete()
        .in('id', selectedItems);

      if (error) throw error;

      setCollections(collections.filter(c => !selectedItems.includes(c.id)));
      setSelectedItems([]);
      toast({
        title: "Success",
        description: `${selectedItems.length} collections deleted successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete collections",
        variant: "destructive",
      });
    }
  };

  const handleCardClick = (id: string) => {
    if (editMode) {
      if (selectedItems.includes(id)) {
        setSelectedItems(selectedItems.filter(item => item !== id));
      } else {
        setSelectedItems([...selectedItems, id]);
      }
    } else {
      navigate(`/collection/${id}`);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteCollection(id);
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredCollections.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredCollections.map(c => c.id));
    }
  };

  const toggleSeriesExpansion = (series: string) => {
    if (expandedSeries.includes(series)) {
      setExpandedSeries(expandedSeries.filter(s => s !== series));
    } else {
      setExpandedSeries([...expandedSeries, series]);
    }
  };

  const categories = Array.from(new Set(collections.map(c => c.category))).filter(Boolean);
  const bookSeries = Array.from(new Set(collections.map(c => c.book_series))).filter(Boolean);

  const groupedCollections = groupBySeries ? 
    filteredCollections.reduce((acc, collection) => {
      const series = collection.book_series || 'No Series';
      if (!acc[series]) acc[series] = [];
      acc[series].push(collection);
      return acc;
    }, {} as Record<string, VoiceCollection[]>) : {};

  const renderCollectionCard = (collection: VoiceCollection) => (
    <Card 
      key={collection.id} 
      className={`hover:shadow-lg transition-shadow group cursor-pointer ${
        editMode && selectedItems.includes(collection.id) ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => handleCardClick(collection.id)}
    >
      {editMode && (
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={selectedItems.includes(collection.id)}
            onChange={() => {}}
          />
        </div>
      )}
      
      {viewMode === 'grid' ? (
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
          {!editMode && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {collection.audio_url ? (
                <Button size="sm" variant="secondary">
                  <Play className="h-4 w-4" />
                </Button>
              ) : (
                <div className="px-2 py-1 bg-orange-500 text-white text-xs rounded">
                  Ungenerated Sound
                </div>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => handleDeleteClick(e, collection.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : null}
      
      <CardContent className={viewMode === 'grid' ? "p-4" : "p-6"}>
        <div className={viewMode === 'list' ? "flex items-center gap-4" : ""}>
          {viewMode === 'list' && (
            <div className="w-16 h-20 flex-shrink-0 rounded overflow-hidden">
              {collection.cover_image_url ? (
                <img
                  src={collection.cover_image_url}
                  alt={collection.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <div className="text-lg font-bold text-primary/40">
                    {collection.title.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1 line-clamp-2">{collection.title}</h3>
            <p className="text-sm text-muted-foreground mb-2">{collection.category}</p>
            {collection.book_series && (
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded mb-2">
                Series: {collection.book_series}
              </span>
            )}
            {!collection.audio_url && (
              <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded mb-2">
                Ungenerated Sound
              </span>
            )}
            <p className="text-xs text-muted-foreground mb-3">
              Created: {new Date(collection.created_at).toLocaleDateString()}
            </p>
            
            {viewMode === 'list' && !editMode && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Play className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => handleDeleteClick(e, collection.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center py-8">Loading collections...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Voice Collections</h1>
          <p className="text-muted-foreground">Manage and organize your generated audio files</p>
        </div>

        {/* Edit Mode Bar */}
        {editMode ? (
          <div className="mb-6 p-4 bg-primary/10 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Edit Mode</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedItems.length === filteredCollections.length ? 'Deselect All' : 'Select All'}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedItems.length} selected
                </span>
              </div>
              <div className="flex gap-2">
                {selectedItems.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteSelectedCollections}
                  >
                    Delete Selected ({selectedItems.length})
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditMode(false);
                    setSelectedItems([]);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Exit Edit Mode
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Filters and Controls */
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search collections, categories, or series..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSeries} onValueChange={setSelectedSeries}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by series" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Series</SelectItem>
                {bookSeries.map(series => (
                  <SelectItem key={series} value={series}>{series}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="series">Series</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGroupBySeries(!groupBySeries)}
              >
                Group Series
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(true)}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Collections Grid/List */}
        {filteredCollections.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm || selectedCategory !== 'all' || selectedSeries !== 'all'
                  ? 'No collections match your search criteria.' 
                  : 'No voice collections yet. Create your first one!'
                }
              </p>
              <Link to="/text-to-speech">
                <Button className="mt-4">Create New Collection</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div>
            {groupBySeries ? (
              <div className="space-y-6">
                {Object.entries(groupedCollections).map(([series, seriesCollections]) => (
                  <div key={series}>
                    <div 
                      className="flex items-center gap-2 mb-4 cursor-pointer hover:text-primary"
                      onClick={() => toggleSeriesExpansion(series)}
                    >
                      {expandedSeries.includes(series) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <h3 className="text-lg font-semibold">{series}</h3>
                      <span className="text-sm text-muted-foreground">({seriesCollections.length})</span>
                    </div>
                    
                    {expandedSeries.includes(series) && (
                      <div className={viewMode === 'grid' 
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ml-6" 
                        : "space-y-4 ml-6"
                      }>
                        {seriesCollections.map(renderCollectionCard)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
                : "space-y-4"
              }>
                {filteredCollections.map(renderCollectionCard)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
