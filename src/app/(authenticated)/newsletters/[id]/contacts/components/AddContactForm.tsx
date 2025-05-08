'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AddContactFormProps {
  newsletterId: string;
}

export default function AddContactForm({ newsletterId }: AddContactFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setError(null);
    setSuccess(false);
    setLoading(true);
    
    // Basic validation
    if (!email) {
      setError('Email is required');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/newsletters/${newsletterId}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          first_name: firstName || null,
          last_name: lastName || null,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add contact');
      }
      
      // Reset form
      setEmail('');
      setFirstName('');
      setLastName('');
      setSuccess(true);
      
      // Refresh the page to show the new contact
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred while adding the contact');
      console.error('Error adding contact:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert variant="default" className="border-green-500 bg-green-50 text-green-700 shadow-green-300/50">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Contact added successfully!</AlertDescription>
        </Alert>
      )}
      
      <div>
        <Label htmlFor="email" className="mb-1 block">Email Address</Label>
        <Input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="subscriber@example.com"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="firstName" className="mb-1 block">First Name</Label>
        <Input
          type="text"
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="John"
        />
      </div>
      
      <div>
        <Label htmlFor="lastName" className="mb-1 block">Last Name</Label>
        <Input
          type="text"
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Doe"
        />
      </div>
      
      <div>
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
            </span>
           ) : (
            'Add Contact'
           )}
        </Button>
      </div>
    </form>
  );
} 