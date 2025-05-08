'use server';

import { headers } from 'next/headers';

export async function createNewsletterAction(formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const drive_folder_id = formData.get('folder') as string;
  
  if (!name || !drive_folder_id) {
    throw new Error('Name and Drive folder ID are required');
  }
  
  const requestHeaders = await headers();

  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/newsletters`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': requestHeaders.get('cookie') || '',
    },
    body: JSON.stringify({
      name,
      description,
      drive_folder_id,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API Error: ${error.error || response.statusText || 'Failed to create newsletter'} (Status: ${response.status})`);
  }
  
  return { success: true };
} 