
import React from 'react';
import { Navbar } from '@/components/Navbar';
import { VoiceCollections } from '@/components/VoiceCollections';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Library, Mic, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
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
          </Card>
        </div>

        <div className="mt-8">
          <VoiceCollections />
        </div>
      </div>
    </div>
  );
}
