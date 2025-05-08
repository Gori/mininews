'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, UserX, Users } from 'lucide-react';

interface Member {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'user';
}

interface TeamMembersProps {
  newsletterId: string;
  isOwner: boolean;
  currentUserId: string;
}

export default function TeamMembers({ newsletterId, isOwner, currentUserId }: TeamMembersProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, [newsletterId]);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/newsletters/${newsletterId}/members`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch members');
      }
      
      const data = await response.json();
      setMembers(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching members');
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!isOwner) return;
    
    setRemovingMemberId(memberId);
    
    try {
      const response = await fetch(`/api/newsletters/${newsletterId}/members?memberId=${memberId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove member');
      }
      
      // Refresh the member list
      await fetchMembers();
    } catch (err: any) {
      setError(err.message || 'An error occurred while removing member');
      console.error('Error removing member:', err);
    } finally {
      setRemovingMemberId(null);
    }
  };

  if (loading) {
    return (
      <div className="border-2 border-border rounded-base overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              {isOwner && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                {isOwner && <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Fetching Members</AlertTitle>
        <AlertDescription>
          {error}
          <Button onClick={fetchMembers} variant="neutral" size="sm" className="mt-2">
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (members.length === 0) {
    return (
      <Alert variant="default" className="mt-4 text-center">
        <Users className="h-5 w-5 mx-auto mb-2" /> 
        <AlertTitle>No Team Members Yet</AlertTitle>
        <AlertDescription>
          {isOwner ? 'Invite members to collaborate on this newsletter.' : 'There are no members in this newsletter yet.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="border-2 border-border rounded-base overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            {isOwner && (
              <TableHead className="text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium">
                {member.name || 'Unnamed User'}
                {member.id === currentUserId && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">(You)</span>
                )}
              </TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>
                <Badge variant={member.role === 'owner' ? 'default' : 'neutral'}>
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </Badge>
              </TableCell>
              {isOwner && (
                <TableCell className="text-right">
                  {member.role !== 'owner' && member.id !== currentUserId && (
                    <Button
                      variant="noShadow"
                      size="sm"
                      className="text-red-600 border-red-500 hover:bg-red-100 hover:text-red-700 focus-visible:ring-red-500"
                      onClick={() => removeMember(member.id)}
                      disabled={removingMemberId === member.id}
                    >
                      {removingMemberId === member.id && (
                        <span className="flex items-center">
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Removing...
                        </span>
                      )}
                      {removingMemberId !== member.id && (
                        <span className="flex items-center">
                          <UserX className="mr-1 h-4 w-4"/> Remove
                        </span>
                      )}
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 