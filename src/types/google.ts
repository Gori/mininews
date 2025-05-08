export interface Folder {
  id: string;
  name: string;
  mimeType: string;
}

export interface Breadcrumb {
  id: string;
  name: string;
}

export interface FolderResponse {
  folders: Folder[];
  parentId: string;
  needsAuth?: boolean;
  error?: string;
  details?: string;
}

export interface GoogleOAuthResponse {
  url?: string;
  error?: string;
  alreadyConnected?: boolean;
  message?: string;
  details?: string;
}

export interface GoogleTokenData {
  user_id: string;
  refresh_token: string;
  scope?: string;
}

// Clerk OAuth related types
export interface ClerkOAuthAccount {
  provider: string;
  id: string;
  approvedScopes: string[];
  accessToken: string;
  expiresAt: number; 
}

export interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  modifiedTime?: string;
} 