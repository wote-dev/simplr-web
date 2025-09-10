-- Add reminder columns to tasks table

-- Add reminder-related columns to the tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_datetime TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for reminder queries
CREATE INDEX IF NOT EXISTS idx_tasks_reminder_enabled ON public.tasks(reminder_enabled);
CREATE INDEX IF NOT EXISTS idx_tasks_reminder_datetime ON public.tasks(reminder_datetime);
CREATE INDEX IF NOT EXISTS idx_tasks_reminder_sent ON public.tasks(reminder_sent);

-- Add comment to document the change
COMMENT ON COLUMN public.tasks.reminder_enabled IS 'Whether reminder is enabled for this task';
COMMENT ON COLUMN public.tasks.reminder_datetime IS 'When to send the reminder notification';
COMMENT ON COLUMN public.tasks.reminder_sent IS 'Whether the reminder notification has been sent';