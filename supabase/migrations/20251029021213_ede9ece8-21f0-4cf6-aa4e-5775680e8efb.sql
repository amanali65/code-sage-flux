-- Create table to store PDF chat messages per user and document set
CREATE TABLE IF NOT EXISTS public.pdf_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_ids TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pdf_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for viewing own messages
CREATE POLICY "Users can view their own pdf chat messages"
ON public.pdf_chat_messages
FOR SELECT
USING (auth.uid() = user_id);

-- Policies for inserting own messages
CREATE POLICY "Users can insert their own pdf chat messages"
ON public.pdf_chat_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Composite index for faster lookups by user and files
CREATE INDEX idx_pdf_chat_messages_user_file
ON public.pdf_chat_messages (user_id, file_ids, created_at);
