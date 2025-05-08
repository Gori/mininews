import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase';
import SubscriptionForm from './components/SubscriptionForm';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

async function getNewsletter(id: string) {
  const supabase = createAdminClient();
  
  const { data: newsletter, error } = await supabase
    .from('newsletters')
    .select('id, name, description')
    .eq('id', id)
    .single();
    
  if (error || !newsletter) {
    return null;
  }
  
  return newsletter;
}

export default async function SubscribePage({ params }: { params: { id: string } }) {
  const newsletter = await getNewsletter(params.id);
  
  if (!newsletter) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{newsletter.name}</CardTitle>
          {newsletter.description && (
            <p className="text-muted-foreground pt-2">{newsletter.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <Alert variant="default" className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Subscribe for Updates</AlertTitle>
            <AlertDescription>
              Enter your details below to receive updates directly to your inbox.
            </AlertDescription>
          </Alert>
          
          <SubscriptionForm newsletterId={newsletter.id} />
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground pt-6">
          <p>You can unsubscribe at any time by clicking the link in the footer of our emails.</p>
        </CardFooter>
      </Card>
    </div>
  );
} 