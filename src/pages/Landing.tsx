
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Mic, Library, Settings, Play, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-primary">Novel Voice</div>
          <div className="flex gap-4">
            <Link to="/">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link to="/">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
          Transform Text into Beautiful Speech
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Convert your documents, books, and text into high-quality audio with AI-powered text-to-speech technology. 
          Perfect for audiobooks, learning materials, and accessibility.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/">
            <Button size="lg" className="px-8">
              <Mic className="h-5 w-5 mr-2" />
              Start Creating
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="px-8">
            <Play className="h-5 w-5 mr-2" />
            Watch Demo
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Multiple File Formats</CardTitle>
              <CardDescription>
                Upload PDF, Word documents, or plain text files. Drag and drop for easy conversion.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Mic className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>High-Quality Voices</CardTitle>
              <CardDescription>
                Choose from multiple AI voices with adjustable speed, volume, and language support.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Library className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Audio Library</CardTitle>
              <CardDescription>
                Save, organize, and manage your generated audio files with custom covers and categories.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Customizable Settings</CardTitle>
              <CardDescription>
                Personalize your experience with custom themes, voice preferences, and workspace organization.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Download className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Easy Export</CardTitle>
              <CardDescription>
                Download your audio files in various formats and share them across platforms.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Play className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Instant Preview</CardTitle>
              <CardDescription>
                Listen to your generated audio immediately with built-in playback controls.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already creating amazing audio content with Novel Voice.
          </p>
          <Link to="/">
            <Button size="lg" className="px-8">
              <Mic className="h-5 w-5 mr-2" />
              Start Free Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; 2024 Novel Voice. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
