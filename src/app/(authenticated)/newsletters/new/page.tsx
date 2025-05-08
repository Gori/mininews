'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import GoogleDrivePicker from '@/components/GoogleDrivePicker';
import { createNewsletterAction } from './actions';
import { Folder } from '@/types/google';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function NewNewsletter() {
  const router = useRouter();
  const [selectedFolder, setSelectedFolder] = useState<{id: string, name: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFolderSelect = (folder: Folder) => {
    setSelectedFolder({
      id: folder.id,
      name: folder.name
    });
  };
  
  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Make sure we have a folder selected
      if (!selectedFolder) {
        throw new Error('Please select a Google Drive folder');
      }
      
      // Set the folder ID in the form data
      formData.set('folder', selectedFolder.id);
      
      // Call the server action to create the newsletter
      await createNewsletterAction(formData);
      
      // Redirect to the newsletters page
      router.push('/newsletters');
    } catch (err: any) {
      setError(err.message || 'Failed to create newsletter');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create a New Newsletter</CardTitle>
          <p className="text-muted-foreground pt-2">
            Create a new newsletter by connecting a Google Drive folder.
          </p>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Newsletter Name</Label>
              <Input
                type="text"
                id="name"
                name="name"
                required
                placeholder="Weekly Company Updates"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                placeholder="A brief description of your newsletter"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Google Drive Folder</Label>
              <GoogleDrivePicker 
                onFolderSelect={handleFolderSelect}
                selectedFolder={selectedFolder}
              />
              <p className="text-sm text-gray-500 pt-1">
                Select the Google Drive folder that contains the documents for your newsletter.
              </p>
            </div>
            
            <CardFooter className="flex justify-end space-x-3 pt-6">
              <Link href="/newsletters" passHref legacyBehavior>
                <Button asChild variant="neutral">
                  <a>Cancel</a>
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedFolder}
              >
                {isSubmitting ? 'Creating...' : 'Create Newsletter'}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 