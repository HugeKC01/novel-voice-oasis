
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Upload, FileText, Download, Play, Pause, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import mammoth from 'mammoth';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export const TextToSpeech = () => {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Uncategorized');
  const [bookSeries, setBookSeries] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speaker, setSpeaker] = useState('1');
  const [volume, setVolume] = useState('1');
  const [speed, setSpeed] = useState([1]);
  const [language, setLanguage] = useState('th');
  const [accentColor, setAccentColor] = useState('#3b82f6');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let extractedText = '';
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      setTitle(fileName);

      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          extractedText += pageText + '\n';
        }
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else if (file.type === 'text/plain') {
        extractedText = await file.text();
      } else {
        throw new Error('Unsupported file type');
      }

      setText(extractedText);
      toast({
        title: "File uploaded successfully",
        description: `Extracted ${extractedText.length} characters from ${file.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateSpeech = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to convert to speech.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to generate speech.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Fetch Botnoi API key from Supabase profiles table
      let botnoiToken = '';
      const { data, error } = await supabase
        .from('profiles')
        .select('botnoi_token')
        .eq('id', user.id)
        .single();
      
      if (error || !data?.botnoi_token) {
        throw new Error('Botnoi API key not found. Please set your API key in profile settings.');
      }
      
      botnoiToken = data.botnoi_token;

      const response = await supabase.functions.invoke('generate-speech', {
        body: {
          text: text.trim(),
          speaker,
          volume,
          speed: speed[0],
          language,
          type_media: 'mp3',
          botnoiToken,
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { audio_url } = response.data;
      setAudioUrl(audio_url);
      
      // Auto-save to collection
      await saveCollection(audio_url);
      
      toast({
        title: "Success",
        description: "Speech generated and saved successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate speech",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveCollection = async (audio?: string) => {
    if (!text.trim() || !title.trim()) {
      toast({
        title: "Error",
        description: "Please enter both title and text before saving.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to save collections.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('voice_collections')
        .insert({
          user_id: user.id,
          title: title.trim(),
          original_text: text.trim(),
          audio_url: audio || null,
          speaker,
          volume,
          speed: speed[0],
          language,
          category,
          book_series: bookSeries.trim() || null,
          cover_image_url: coverImageUrl.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: audio ? "Collection saved with audio!" : "Collection saved! You can generate audio later.",
      });

      // Clear form
      setText('');
      setTitle('');
      setCategory('Uncategorized');
      setBookSeries('');
      setCoverImageUrl('');
      setAudioUrl('');
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: "Failed to save collection",
        variant: "destructive",
      });
    }
  };

  const handleSaveCollectionClick = () => {
    saveCollection();
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `${title || 'audio'}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const clearAll = () => {
    setText('');
    setTitle('');
    setCategory('Uncategorized');
    setBookSeries('');
    setCoverImageUrl('');
    setAudioUrl('');
    setIsPlaying(false);
  };

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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Text Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Text Input
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title for your audio"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bookSeries">Book Series (Optional)</Label>
              <Input
                id="bookSeries"
                value={bookSeries}
                onChange={(e) => setBookSeries(e.target.value)}
                placeholder="Enter book series name"
              />
            </div>
            <div>
              <Label htmlFor="coverImage">Cover Image URL (Optional)</Label>
              <Input
                id="coverImage"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="Enter cover image URL"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="file-upload">Upload File</Label>
            <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload PDF, DOCX, or TXT file
              </Button>
            </div>
          </div>
          
          <div>
            <Label htmlFor="text">Text to Convert</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your text here or upload a file above..."
              className="min-h-[200px] mt-2"
            />
            <div className="text-sm text-muted-foreground mt-1">
              Characters: {text.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="speaker">Speaker</Label>
              <Select value={speaker} onValueChange={setSpeaker}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Speaker 1</SelectItem>
                  <SelectItem value="2">Speaker 2</SelectItem>
                  <SelectItem value="3">Speaker 3</SelectItem>
                  <SelectItem value="4">Speaker 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="volume">Volume</Label>
              <Select value={volume} onValueChange={setVolume}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">Low</SelectItem>
                  <SelectItem value="1">Normal</SelectItem>
                  <SelectItem value="1.5">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="speed">Speed: {speed[0]}x</Label>
              <Slider
                value={speed}
                onValueChange={setSpeed}
                max={3}
                min={0.5}
                step={0.25}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="th">Thai</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={generateSpeech}
          disabled={isLoading || !text.trim()}
          className="flex-1 min-w-[200px] relative overflow-hidden"
          style={gradientStyle}
        >
          <div style={gradientBorderStyle}></div>
          <Play className="h-4 w-4 mr-2 relative z-10" />
          <span className="relative z-10">{isLoading ? 'Generating...' : 'Generate Speech'}</span>
        </Button>
        
        <Button
          onClick={handleSaveCollectionClick}
          disabled={!text.trim() || !title.trim()}
          variant="outline"
          className="flex-1 min-w-[200px]"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Collection
        </Button>
        
        <Button
          onClick={clearAll}
          variant="outline"
          className="min-w-[120px]"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>

      {/* Audio Player Section */}
      {audioUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Audio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <audio
              ref={audioRef}
              src={audioUrl}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              controls
              className="w-full"
            />
            
            <div className="flex gap-2">
              <Button onClick={togglePlayPause} variant="outline">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button onClick={downloadAudio} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
