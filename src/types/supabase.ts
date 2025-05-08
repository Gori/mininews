export type NewsletterStatus = 'draft' | 'scheduled' | 'sent';
export type SendStatus = 'pending' | 'sent' | 'error';
export type UserRole = 'owner' | 'user';

export interface User {
  id: string;
  created_at: string;
}

export interface Newsletter {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  drive_folder_id: string;
  created_at: string;
  last_sent_at: string | null;
  status: NewsletterStatus;
}

export interface NewsletterUser {
  newsletter_id: string;
  user_id: string;
  role: UserRole;
}

export interface Contact {
  id: string;
  newsletter_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  subscribed_at: string;
}

export interface Unsubscribe {
  contact_id: string;
  unsubscribed_at: string;
}

export interface GoogleToken {
  user_id: string;
  refresh_token: string;
  scope: string;
  updated_at: string;
}

export interface SendQueue {
  id: string;
  newsletter_id: string;
  doc_id: string;
  scheduled_for: string;
  created_at: string;
}

export interface SendLog {
  id: string;
  queue_id: string;
  contact_id: string;
  status: SendStatus;
  sent_at: string | null;
  error_message: string | null;
}

export interface OpenEvent {
  id: string;
  send_log_id: string;
  opened_at: string;
} 