-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ENUM types
create type newsletter_status as enum ('draft','scheduled','sent');
create type send_status       as enum ('pending','sent','error');
create type user_role         as enum ('owner','user');

-- users table
create table users (
  id text primary key,
  created_at timestamptz not null default now()
);

-- newsletters
create table newsletters (
  id               uuid               primary key default gen_random_uuid(),
  owner_id         text               not null references users(id) on delete cascade,
  name             text               not null,
  description      text,
  drive_folder_id  text               not null,
  created_at       timestamptz        not null default now(),
  last_sent_at     timestamptz,
  status           newsletter_status  not null default 'draft'
);

-- newsletter_users (M2M)
create table newsletter_users (
  newsletter_id uuid        not null references newsletters(id) on delete cascade,
  user_id       text        not null references users(id) on delete cascade,
  role          user_role   not null default 'user',
  primary key(newsletter_id, user_id)
);

-- contacts
create table contacts (
  id             uuid        primary key default gen_random_uuid(),
  newsletter_id  uuid        not null references newsletters(id) on delete cascade,
  email          text        not null,
  first_name     text,
  last_name      text,
  subscribed_at  timestamptz not null default now(),
  unique(newsletter_id, email)
);

-- unsubscribes
create table unsubscribes (
  contact_id      uuid        primary key references contacts(id) on delete cascade,
  unsubscribed_at timestamptz not null default now()
);

-- OAuth tokens
create table google_tokens (
  user_id       text        primary key references users(id) on delete cascade,
  refresh_token text        not null,
  scope         text        not null,
  updated_at    timestamptz not null default now()
);

-- send_queue
create table send_queue (
  id              uuid        primary key default gen_random_uuid(),
  newsletter_id   uuid        not null references newsletters(id) on delete cascade,
  doc_id          text        not null,
  scheduled_for   date        not null,
  created_at      timestamptz not null default now(),
  unique(newsletter_id, doc_id, scheduled_for)
);

-- send_logs
create table send_logs (
  id           uuid        primary key default gen_random_uuid(),
  queue_id     uuid        not null references send_queue(id) on delete cascade,
  contact_id   uuid        not null references contacts(id) on delete cascade,
  status       send_status not null default 'pending',
  sent_at      timestamptz default now(),
  error_message text
);

-- open_events
create table open_events (
  id           uuid        primary key default gen_random_uuid(),
  send_log_id  uuid        not null references send_logs(id) on delete cascade,
  opened_at    timestamptz not null default now()
);

-- Indexes for performance
create index idx_newsletters_owner    on newsletters(owner_id);
create index idx_newsletter_users_uid on newsletter_users(user_id);
create index idx_contacts_newsletter  on contacts(newsletter_id);
create index idx_send_queue_date      on send_queue(scheduled_for);
create index idx_send_logs_queue      on send_logs(queue_id);
create index idx_send_logs_contact    on send_logs(contact_id);
create index idx_open_events_log      on open_events(send_log_id); 