'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Breadcrumb, Folder, FolderResponse } from '../types/google';
import { ChevronRight, FolderIcon, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Breadcrumb as UIBreadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface GoogleDrivePickerProps {
  onFolderSelect: (folder: Folder) => void;
  selectedFolder?: { id: string, name: string } | null;
}

export default function GoogleDrivePicker({ onFolderSelect, selectedFolder }: GoogleDrivePickerProps) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ id: 'root', name: 'My Drive' }]);
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [isLoading, setIsLoading] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  // Check if user has Google connected with correct scopes
  useEffect(() => {
    if (isUserLoaded && user) {
      // Since the Google account might exist but not have an access token
      // we'll let the API determine if we need authentication
      setNeedsAuth(false);
    }
  }, [user, isUserLoaded]);

  // Load folders when the current folder ID changes
  useEffect(() => {
    if (isOpen && currentFolderId) {
      loadFolders(currentFolderId);
    }
  }, [isOpen, currentFolderId]);

  const loadFolders = async (folderId: string) => {
    setIsLoading(true);
    setError(null);
    setConfigError(null);
    
    try {
      // Use window.location.origin to ensure we use the correct port
      const response = await fetch(`${window.location.origin}/api/google/drive/folders?parentId=${folderId}`);
      const data: FolderResponse = await response.json();
      
      if (!response.ok) {
        if (data.needsAuth) {
          setNeedsAuth(true);
          setFolders([]);
        } else if (data.error?.includes('credentials') || data.details?.includes('credentials')) {
          // Configuration error - missing credentials
          setConfigError('Google OAuth credentials are not properly configured.');
          setFolders([]);
        } else {
          throw new Error(data.error || 'Failed to load folders');
        }
      } else {
        setFolders(data.folders || []);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Error loading folders:', err);
      if (err instanceof Error) {
        if (err.message.includes('credentials')) {
          setConfigError('Google OAuth credentials are not properly configured.');
        } else {
          setError(`Failed to load Google Drive folders: ${err.message}`);
        }
      } else {
        setError('Failed to load Google Drive folders');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPicker = () => {
    setIsOpen(true);
    setError(null);
    setConfigError(null);
  };

  const handleClosePicker = () => {
    setIsOpen(false);
  };

  const handleFolderClick = (folder: Folder) => {
    setCurrentFolderId(folder.id);
    
    // Update breadcrumbs
    const breadcrumbIndex = breadcrumbs.findIndex(b => b.id === folder.id);
    
    if (breadcrumbIndex >= 0) {
      // If folder is already in breadcrumbs, trim to that point
      setBreadcrumbs(breadcrumbs.slice(0, breadcrumbIndex + 1));
    } else {
      // Otherwise add to breadcrumbs
      setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
    }
  };

  const handleBreadcrumbClick = (breadcrumb: Breadcrumb) => {
    setCurrentFolderId(breadcrumb.id);
    const breadcrumbIndex = breadcrumbs.findIndex(b => b.id === breadcrumb.id);
    setBreadcrumbs(breadcrumbs.slice(0, breadcrumbIndex + 1));
  };

  const handleSelectFolder = (folder: Folder) => {
    onFolderSelect(folder);
    handleClosePicker();
  };

  const handleConnectGoogle = async () => {
    try {
      // Set loading state while connecting
      setIsLoading(true);
      setError(null);
      setConfigError(null);
      
      // Keep track of the current URL including any query parameters
      const currentUrl = window.location.pathname + window.location.search;
      
      // Use window.location.origin to ensure we use the correct port
      const response = await fetch(`${window.location.origin}/api/google/auth?redirectUrl=${encodeURIComponent(currentUrl)}`);
      const data = await response.json();
      
      if (response.ok) {
        if (data.alreadyConnected) {
          // If already connected with required permissions, just load folders
          setNeedsAuth(false);
          loadFolders('root');
        } else if (data.url) {
          // Display connecting message before redirecting
          setIsLoading(false);
          setNeedsAuth(false);
          setFolders([{
            id: 'connecting',
            name: 'Redirecting to Google...',
            mimeType: ''
          }]);
          
          // Redirect to Google OAuth
          window.location.href = data.url;
        }
      } else {
        if (data.details?.includes('credentials') || data.error?.includes('credentials')) {
          setConfigError('Google OAuth credentials are not properly configured. Please contact the administrator.');
        } else {
          throw new Error(data.error || 'Failed to connect to Google');
        }
      }
    } catch (err) {
      console.error('Error connecting to Google:', err);
      if (err instanceof Error && err.message.includes('credentials')) {
        setConfigError('Google OAuth credentials are not properly configured. Please contact the administrator.');
      } else {
        setError('Failed to connect to Google Drive');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        {!isOpen ? (
          <Button
            type="button"
            onClick={handleOpenPicker}
            variant="noShadow"
            className="w-full justify-start"
          >
            <FolderIcon className="mr-2 h-4 w-4" />
            {selectedFolder ? selectedFolder.name : 'Select Google Drive folder'}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleClosePicker}
            variant="noShadow"
            size="sm"
          >
            Close
          </Button>
        )}
      </div>
      
      {selectedFolder && !isOpen && (
        <p className="text-sm text-muted-foreground">
          Selected folder: {selectedFolder.name}
        </p>
      )}

      {isOpen && (
        <Card className="max-h-[400px] overflow-hidden flex flex-col">
          <CardContent className="p-4 overflow-y-auto">
            {/* Breadcrumbs */}
            <UIBreadcrumb className="mb-4">
              <BreadcrumbList>
                {breadcrumbs.map((breadcrumb, index) => (
                  <React.Fragment key={breadcrumb.id}>
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleBreadcrumbClick(breadcrumb);
                        }}
                        className={currentFolderId === breadcrumb.id ? "font-semibold" : ""}
                      >
                        {breadcrumb.name}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </UIBreadcrumb>

            {isLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && !configError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {configError && (
              <Alert variant="default" className="mb-4 bg-amber-50 border-amber-200 text-amber-800">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle>Configuration Issue</AlertTitle>
                <AlertDescription>
                  {configError}
                  <p className="mt-2 text-sm">
                    Please see the <Link href="/GOOGLE_SETUP.md" target="_blank" className="underline">setup instructions</Link> for configuring Google OAuth credentials.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {needsAuth && !isLoading && !configError && !error && (
              <div className="flex flex-col items-center py-6 text-center">
                <p className="text-muted-foreground mb-4">
                  Connect your Google account to browse Drive folders.
                </p>
                <div className="flex flex-col gap-2">
                  <Button onClick={handleConnectGoogle} type="button">
                    Connect to Google Drive
                  </Button>
                  <Link 
                    href="/test-google-drive/direct-auth"
                    className="text-blue-500 text-sm hover:underline"
                  >
                    Having trouble? Try direct setup
                  </Link>
                </div>
              </div>
            )}

            {!needsAuth && !isLoading && folders.length === 0 && !configError && !error && (
              <p className="text-center text-muted-foreground py-4">
                No folders found in this location.
              </p>
            )}

            {/* Folder list */}
            {!isLoading && !needsAuth && !error && !configError && folders.length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className={`border-2 border-border rounded-base p-3 flex items-center justify-between hover:bg-gray-100 transition-colors ${
                      folder.id === 'connecting' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    onClick={() => folder.id !== 'connecting' && handleFolderClick(folder)}
                  >
                    <div className="flex items-center gap-2">
                      <FolderIcon className="h-5 w-5 text-foreground" />
                      <span>{folder.name}</span>
                    </div>
                    {folder.id !== 'connecting' && (
                      <Button
                        type="button"
                        size="sm"
                        variant="noShadow"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectFolder(folder);
                        }}
                      >
                        Select
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 