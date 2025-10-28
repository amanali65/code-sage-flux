-- Create table for storing PDF metadata
CREATE TABLE IF NOT EXISTS public.pdfs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_id TEXT NOT NULL,
  name TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pdfs ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own PDFs" 
ON public.pdfs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PDFs" 
ON public.pdfs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PDFs" 
ON public.pdfs 
FOR DELETE 
USING (auth.uid() = user_id);