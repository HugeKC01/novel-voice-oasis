import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { GradientButton } from '@/components/GradientButton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Upload, Download, Play, Pause, Volume2, BookOpen, Hash, Save } from 'lucide-react';
import mammoth from 'mammoth';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/webpack';

interface TextToSpeechProps { }

export const TextToSpeech: React.FC<TextToSpeechProps> = () => {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Uncategorized');
  const [bookSeries, setBookSeries] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [speaker, setSpeaker] = useState('1');
  const [volume, setVolume] = useState('1');
  const [speed, setSpeed] = useState(1);
  const [language, setLanguage] = useState('th');
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const updateCurrentTime = () => {
        setCurrentTime(audio.currentTime);
      };

      const updateDuration = () => {
        setDuration(audio.duration);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audio.addEventListener('timeupdate', updateCurrentTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('timeupdate', updateCurrentTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [audioUrl]);

  const generateSpeech = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to convert to speech",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
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
          text: text.trim(),
          speaker,
          volume,
          speed,
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
    } finally {
      setIsGenerating(false);
    }
  };

  const saveCollection = async (generateAudio = false) => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to save",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your collection",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      let finalAudioUrl = audioUrl;

      // Generate audio if requested and not already generated
      if (generateAudio && !audioUrl) {
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
            text: text.trim(),
            speaker,
            volume,
            speed,
            language,
            type_media: 'mp3',
            botnoiToken,
          }
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        finalAudioUrl = response.data.audio_url;
        setAudioUrl(finalAudioUrl);
      }

      const { error } = await supabase
        .from('voice_collections')
        .insert({
          user_id: user!.id,
          title: title.trim(),
          original_text: text.trim(),
          audio_url: finalAudioUrl || null,
          speaker,
          volume,
          speed,
          language,
          category,
          book_series: bookSeries.trim() || null,
          cover_image_url: coverImageUrl.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: generateAudio 
          ? "Collection saved and speech generated successfully!"
          : "Collection saved successfully! You can generate speech later.",
      });

      // Reset form
      setText('');
      setTitle('');
      setCategory('Uncategorized');
      setBookSeries('');
      setCoverImageUrl('');
      setAudioUrl('');
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save collection",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCollectionClick = () => {
    saveCollection(false);
  };

  const handleGenerateAndSaveClick = () => {
    saveCollection(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (event) => {
          setText(event.target?.result as string || '');
        };
        reader.readAsText(file);
      } else if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            // @ts-ignore
            const pdfData = new Uint8Array(event.target?.result as ArrayBuffer);
            const pdf = await pdfjsLib.getDocument(pdfData).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map(item => item.str).join(' ');
              fullText += pageText + '\n';
            }
            setText(fullText);
          } catch (pdfError) {
            console.error("Error reading PDF:", pdfError);
            toast({
              title: "Error",
              description: "Failed to read PDF file",
              variant: "destructive",
            });
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            setText(result.value);
          } catch (docxError) {
            console.error("Error reading DOCX:", docxError);
            toast({
              title: "Error",
              description: "Failed to read DOCX file",
              variant: "destructive",
            });
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        toast({
          title: "Error",
          description: "Unsupported file type. Please upload a .txt, .pdf, or .docx file.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Text to Speech Generator</h1>
        <p className="text-muted-foreground">Convert your text into natural-sounding speech</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Text Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your collection..."
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
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

                <div>
                  <label className="text-sm font-medium mb-2 block">Book Series</label>
                  <Input
                    value={bookSeries}
                    onChange={(e) => setBookSeries(e.target.value)}
                    placeholder="Enter series name..."
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Cover Image URL</label>
                <Input
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="Enter image URL..."
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Text to Convert</label>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter the text you want to convert to speech..."
                  className="min-h-[200px] resize-none"
                />
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {text.length.toLocaleString()} characters
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    ~{Math.ceil(text.split(' ').length / 200)} minutes
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.pdf,.docx"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload File
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Voice Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Voice Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Speaker</label>
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
                  <label className="text-sm font-medium mb-2 block">Volume</label>
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

                <div>
                  <label className="text-sm font-medium mb-2 block">Speed</label>
                  <Select value={speed.toString()} onValueChange={(value) => setSpeed(parseFloat(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">0.5x</SelectItem>
                      <SelectItem value="0.75">0.75x</SelectItem>
                      <SelectItem value="1">1x</SelectItem>
                      <SelectItem value="1.25">1.25x</SelectItem>
                      <SelectItem value="1.5">1.5x</SelectItem>
                      <SelectItem value="2">2x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Language</label>
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

              <div className="flex gap-2">
                <GradientButton
                  onClick={generateSpeech}
                  disabled={isGenerating || !text.trim()}
                  className="flex-1"
                >
                  {isGenerating ? "Generating..." : "Generate Speech"}
                </GradientButton>
                <Button
                  variant="outline"
                  onClick={handleSaveCollectionClick}
                  disabled={isSaving || !text.trim() || !title.trim()}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Without Audio
                </Button>
              </div>
              
              <GradientButton
                onClick={handleGenerateAndSaveClick}
                disabled={isSaving || !text.trim() || !title.trim()}
                className="w-full"
              >
                {isSaving ? "Saving..." : "Generate & Save Collection"}
              </GradientButton>
            </CardContent>
          </Card>
        </div>

        {/* Output Section */}
        <div className="space-y-6">
          {/* Audio Player */}
          <Card>
            <CardHeader>
              <CardTitle>Audio Player</CardTitle>
            </CardHeader>
            <CardContent>
              {audioUrl ? (
                <div className="space-y-4">
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    className="w-full"
                    controls
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = audioUrl;
                        link.download = 'generated-speech.mp3';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Volume2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No audio generated yet</p>
                  <p className="text-sm">Enter text and click "Generate Speech" to create audio</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Text Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Text Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto p-4 bg-muted rounded-lg">
                {text ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Your text will appear here...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
