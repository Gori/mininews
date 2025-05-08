'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Search, UserX, Trash2, UserCheck, UserMinus } from 'lucide-react';

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  subscribed_at: string;
  isSubscribed: boolean;
  unsubscribed_at: string | null;
}

interface ContactsListProps {
  contacts: Contact[];
  newsletterId: string;
}

export default function ContactsList({ contacts, newsletterId }: ContactsListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleUnsubscribe = async (contactId: string) => {
    if (actionLoading) return;
    
    setActionLoading(contactId);
    setError(null);
    
    try {
      const response = await fetch(`/api/newsletters/${newsletterId}/contacts/${contactId}/unsubscribe`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unsubscribe contact');
      }
      
      // Refresh the page to show updated status
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Error unsubscribing contact:', err);
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleResubscribe = async (contactId: string) => {
    if (actionLoading) return;
    
    setActionLoading(contactId);
    setError(null);
    
    try {
      const response = await fetch(`/api/newsletters/${newsletterId}/contacts/${contactId}/resubscribe`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to resubscribe contact');
      }
      
      // Refresh the page to show updated status
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Error resubscribing contact:', err);
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleDelete = async (contactId: string) => {
    if (actionLoading) return;
    
    if (!confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      return;
    }
    
    setActionLoading(contactId);
    setError(null);
    
    try {
      const response = await fetch(`/api/newsletters/${newsletterId}/contacts/${contactId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete contact');
      }
      
      // Refresh the page to remove the deleted contact
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Error deleting contact:', err);
    } finally {
      setActionLoading(null);
    }
  };
  
  // Filter contacts based on search term
  const filteredContacts = contacts.filter(
    (contact) => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        contact.email.toLowerCase().includes(searchTermLower) ||
        (contact.first_name && contact.first_name.toLowerCase().includes(searchTermLower)) ||
        (contact.last_name && contact.last_name.toLowerCase().includes(searchTermLower))
      );
    }
  );
  
  return (
    <div>
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search contacts by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {filteredContacts.length === 0 ? (
        <Alert variant="default" className="mt-4 text-center">
          <Search className="h-5 w-5 mx-auto mb-2" /> 
          <AlertTitle>{searchTerm ? 'No Contacts Found' : 'No Contacts Yet'}</AlertTitle>
          <AlertDescription>
            {searchTerm ? 'No contacts match your search criteria.' : 'Add your first contact to get started.'}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="border-2 border-border rounded-base overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id} className={!contact.isSubscribed ? 'opacity-75' : ''}>
                  <TableCell>
                    <div className="font-medium text-foreground">
                      {contact.first_name || contact.last_name
                        ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                        : 'Unnamed'
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">{contact.email}</div>
                  </TableCell>
                  <TableCell>
                    {contact.isSubscribed ? (
                      <Badge variant="default">Subscribed</Badge>
                    ) : (
                      <Badge variant="neutral">Unsubscribed</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {contact.isSubscribed ? (
                      <Button
                        variant="noShadow"
                        size="sm"
                        className="text-orange-600 border-orange-500 hover:bg-orange-100 hover:text-orange-700 focus-visible:ring-orange-500"
                        onClick={() => handleUnsubscribe(contact.id)}
                        disabled={actionLoading === contact.id}
                      >
                        {actionLoading === contact.id && contact.isSubscribed ? (
                          <span className="flex items-center"><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Working...</span>
                        ) : (
                          <span className="flex items-center"><UserMinus className="mr-1 h-4 w-4"/> Unsubscribe</span>
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="noShadow"
                        size="sm"
                        className="text-green-600 border-green-500 hover:bg-green-100 hover:text-green-700 focus-visible:ring-green-500"
                        onClick={() => handleResubscribe(contact.id)}
                        disabled={actionLoading === contact.id}
                      >
                        {actionLoading === contact.id && !contact.isSubscribed ? (
                          <span className="flex items-center"><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Working...</span>
                        ) : (
                          <span className="flex items-center"><UserCheck className="mr-1 h-4 w-4"/> Resubscribe</span>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="noShadow"
                      size="sm"
                      className="text-red-600 border-red-500 hover:bg-red-100 hover:text-red-700 focus-visible:ring-red-500"
                      onClick={() => handleDelete(contact.id)}
                      disabled={actionLoading === contact.id}
                    >
                      {actionLoading === contact.id && window.confirm('Are you sure you want to delete this contact? This action cannot be undone.') ? (
                        // This specific loading state for delete is tricky with confirm, simplified for now
                        (<span className="flex items-center"><Loader2 className="mr-1 h-4 w-4 animate-spin" />Working...</span>)
                      ) : (
                        <span className="flex items-center"><Trash2 className="mr-1 h-4 w-4"/> Delete</span>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
} 