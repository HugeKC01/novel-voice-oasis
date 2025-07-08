
import React from 'react';
import { Navbar } from '@/components/Navbar';
import { TextToSpeech } from '@/components/TextToSpeech';

export default function TextToSpeechPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Text to Speech Generator</h1>
          <p className="text-muted-foreground">Convert your text files or direct input into high-quality speech</p>
        </div>
        <TextToSpeech />
      </div>
    </div>
  );
}
