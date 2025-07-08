
import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { TextToSpeech } from '@/components/TextToSpeech';
import { VoiceCollections } from '@/components/VoiceCollections';
import { Button } from '@/components/ui/button';
import { FileText, Library } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'generator' | 'collections'>('generator');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'generator' ? 'default' : 'outline'}
              onClick={() => setActiveTab('generator')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Text to Speech
            </Button>
            <Button
              variant={activeTab === 'collections' ? 'default' : 'outline'}
              onClick={() => setActiveTab('collections')}
            >
              <Library className="h-4 w-4 mr-2" />
              My Collections
            </Button>
          </div>
        </div>

        {activeTab === 'generator' && <TextToSpeech />}
        {activeTab === 'collections' && <VoiceCollections />}
      </div>
    </div>
  );
}
