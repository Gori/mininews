'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SubscriptionFormProps {
  newsletterId: string;
}

export default function SubscriptionForm({ newsletterId }: SubscriptionFormProps) {
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
      const response = await fetch(`/api/public/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newsletter_id: newsletterId,
          email,
          first_name: firstName || null,
          last_name: lastName || null,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }
      
      // Reset form on success
      setEmail('');
      setFirstName('');
      setLastName('');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      console.error('Error subscribing:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Alert variant="default" className="border-green-500 bg-green-50 text-green-700 shadow-green-300/50 text-center py-6">
        <CheckCircle2 className="h-6 w-6 mx-auto mb-2" />
        <AlertTitle className="text-xl font-semibold mb-2">Success!</AlertTitle>
        <AlertDescription>
          Thank you for subscribing. You'll receive our next newsletter at the email address you provided.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div>
        <Label htmlFor="email" className="mb-1 block">
          Email Address <span className="text-destructive">*</span>
        </Label>
        <Input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
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
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subscribing...
            </span>
           ) : (
            'Subscribe'
           )}
        </Button>
      </div>
    </form>
  );
} 