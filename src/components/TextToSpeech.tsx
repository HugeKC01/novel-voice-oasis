import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Upload, Play, Save, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
// @ts-expect-error
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const TextToSpeech = () => {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('1');
  const [volume, setVolume] = useState('1');
  const [speed, setSpeed] = useState(1);
  const [language, setLanguage] = useState('th');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Helper: Parse PDF file
  const parsePdf = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return text;
  };

  // Helper: Parse DOCX file
  const parseDocx = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    return value;
  };

  const handleFileUpload = async (eventOrFile: React.ChangeEvent<HTMLInputElement> | File) => {
    let file: File | undefined;
    if (eventOrFile instanceof File) {
      file = eventOrFile;
    } else {
      file = eventOrFile.target.files?.[0];
    }
    if (!file) return;

    let extractedText = '';
    if (file.type === 'text/plain') {
      extractedText = await file.text();
    } else if (file.type === 'application/pdf') {
      try {
        extractedText = await parsePdf(file);
      } catch {
        toast({ title: 'PDF Error', description: 'Failed to parse PDF.' });
      }
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.endsWith('.docx')
    ) {
      try {
        extractedText = await parseDocx(file);
      } catch {
        toast({ title: 'DOCX Error', description: 'Failed to parse DOCX.' });
      }
    } else {
      toast({ title: 'Unsupported File', description: 'Please upload a TXT, PDF, or DOCX file.' });
      return;
    }
    setText(extractedText);
    setTitle(file.name.split('.')[0]);
  };

  // Drag-and-drop handlers
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const generateSpeech = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to convert to speech",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
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
      // Automatically save after generation
      await saveCollection(audio_url);
      toast({
        title: "Success",
        description: "Speech generated and saved to your collection!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate speech",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Accept audioUrl as param for auto-save
  const saveCollection = async (audio?: string) => {
    const url = audio || audioUrl;
    if (!url || !user) return;
    try {
      const { error } = await supabase
        .from('voice_collections')
        .insert({
          user_id: user.id,
          title: title || 'Untitled',
          original_text: text,
          audio_url: url,
          speaker,
          volume,
          speed,
          language,
          file_type: 'mp3'
        });
      if (error) throw error;

      toast({
        title: "Success",
        description: "Voice collection saved successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save collection",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Text to Speech Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <Input
              placeholder="Enter a title for your audio..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Upload File or Enter Text</label>
            <div
              className={`flex gap-2 mb-2 border-2 rounded-md p-4 cursor-pointer transition-colors ${dragActive ? 'border-primary bg-primary/10' : 'border-dashed border-muted'}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Drag & drop PDF, DOCX, or TXT here, or click to upload
              <input
                id="file-upload"
                type="file"
                accept=".txt,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <Textarea
              placeholder="Enter your text here or upload a file..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <Input
                type="number"
                min="0.5"
                max="2"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
              />
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
            <Button onClick={generateSpeech} disabled={loading}>
              {loading ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Generate Speech
            </Button>
            
            {audioUrl && (
              <Button variant="outline" onClick={saveCollection}>
                <Save className="h-4 w-4 mr-2" />
                Save Collection
              </Button>
            )}
          </div>

          {audioUrl && (
            <div className="mt-4">
              <audio controls className="w-full">
                <source src={audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
