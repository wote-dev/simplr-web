import { useState, useEffect } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Trash2, Bell, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/useToastContext';
import type { Task, TaskCategory, ChecklistItem } from '@/types';
import { taskCategories } from '@/hooks/useTasks';
import { 
  requestNotificationPermission, 
  getNotificationPermission, 
  isNotificationSupported,
  getDefaultReminderTime,
  isValidReminderTime 
} from '@/lib/notifications';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  task?: Task;
}

export function TaskModal({ isOpen, onClose, onSave, task }: TaskModalProps) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('PERSONAL');
  const [dueDate, setDueDate] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDateTime, setReminderDateTime] = useState('');
  const [permissionRequested, setPermissionRequested] = useState(false);

  // Update form state when task prop changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setCategory(task.category || 'PERSONAL');
      setDueDate(task.dueDate || '');
      setChecklist(task.checklist || []);
      setReminderEnabled(task.reminderEnabled || false);
      setReminderDateTime(task.reminderDateTime || '');
    } else {
      // Reset form for new task
      setTitle('');
      setDescription('');
      setCategory('PERSONAL');
      setDueDate('');
      setChecklist([]);
      setReminderEnabled(false);
      setReminderDateTime('');
    }
    setNewChecklistItem('');
  }, [task]);

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setCategory('PERSONAL');
    setDueDate('');
    setChecklist([]);
    setNewChecklistItem('');
    onClose();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('Please enter a task title', 'error');
      return;
    }

    // Validate reminder settings
    if (reminderEnabled) {
      if (!reminderDateTime) {
        showToast('Please set a reminder date and time', 'error');
        return;
      }
      if (!isValidReminderTime(reminderDateTime)) {
        showToast('Reminder time must be in the future', 'error');
        return;
      }
    }

    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        category,
        dueDate,
        checklist,
        completed: task?.completed || false,
        reminderEnabled,
        reminderDateTime: reminderEnabled ? reminderDateTime : null,
        reminderSent: false,
      });

      showToast(
        task ? `"${title.trim()}" updated successfully!` : `"${title.trim()}" created successfully!`,
        'success',
        3000
      );
      
      handleClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      showToast(
        task ? 'Failed to update task' : 'Failed to create task',
        'error'
      );
    }
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;

    const newItem: ChecklistItem = {
      id: Date.now(),
      text: newChecklistItem.trim(),
      done: false,
    };

    setChecklist([...checklist, newItem]);
    setNewChecklistItem('');
  };

  // Handle reminder toggle
  const handleReminderToggle = async () => {
    if (!reminderEnabled) {
      // Enabling reminder - check permissions
      if (!isNotificationSupported()) {
        showToast('Notifications are not supported in this browser', 'error');
        return;
      }

      const permission = getNotificationPermission();
      if (permission === 'denied') {
        showToast('Notifications are blocked. Please enable them in your browser settings.', 'error');
        return;
      }

      if (permission === 'default' && !permissionRequested) {
        try {
          const newPermission = await requestNotificationPermission();
          setPermissionRequested(true);
          if (newPermission !== 'granted') {
            showToast('Notification permission is required for reminders', 'error');
            return;
          }
        } catch (error) {
          showToast('Failed to request notification permission', 'error');
          return;
        }
      }

      // Set default reminder time if not set
      if (!reminderDateTime) {
        const defaultTime = getDefaultReminderTime({ dueDate } as Task);
        setReminderDateTime(defaultTime);
      }
    }

    setReminderEnabled(!reminderEnabled);
  };

  // Keyboard event handlers
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      // ESC key to dismiss modal
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }

      // CMD+Return (Mac) or Ctrl+Return (Windows/Linux) to save
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (title.trim()) {
          handleSave();
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, title, handleClose, handleSave]);

  const removeChecklistItem = (id: number) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  const toggleChecklistItem = (id: number) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, done: !item.done } : item
    ));
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-0 duration-300">
      <div className="bg-background rounded-xl shadow-2xl border border-border/20 w-full max-w-md max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Modal Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b-2 border-border bg-muted/50 backdrop-blur-sm">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose}
            className="h-8 w-8 rounded-full hover:bg-muted"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold tracking-tight">
            {task ? 'Edit Task' : 'Add Task'}
          </h2>
          <Button 
            onClick={handleSave} 
            disabled={!title.trim()}
            className="font-semibold px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {task ? 'Update' : 'Save'}
          </Button>
        </header>
        
        {/* Modal Content */}
        <div className="px-6 py-4 overflow-y-auto bg-background max-h-[calc(90vh-80px)]">
          {/* Intro Section */}
          <div className="text-left mb-4 pb-3 border-b border-border/30">
            <h3 className="text-xl font-bold mb-1 text-foreground">
              {task ? 'Edit Task' : 'Add New Task'}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {task ? 'Update your task details below' : 'Create a new task to stay organized and focused'}
            </p>
          </div>
          
          <div className="space-y-4">
            {/* Task Details Section */}
            <Card>
              <CardHeader>
                <CardTitle>Task Details</CardTitle>
                <CardDescription>Give your task a clear title and optional description</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                    placeholder="e.g., Complete quarterly report"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                    placeholder="Add context, requirements, or notes..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Due Date Section */}
            <Card>
              <CardHeader>
                <CardTitle>Due Date</CardTitle>
                <CardDescription>Set when this task should be completed</CardDescription>
              </CardHeader>
              <CardContent>
                <DatePicker
                  date={dueDate ? new Date(dueDate) : undefined}
                  onDateChange={(date) => setDueDate(date ? date.toISOString() : '')}
                  placeholder="Select due date"
                />
              </CardContent>
            </Card>

            {/* Reminder Section */}
            <Card>
              <CardHeader>
                <CardTitle>Reminder</CardTitle>
                <CardDescription>Get notified about your task at a specific time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {reminderEnabled ? (
                      <Bell className="h-4 w-4 text-primary" />
                    ) : (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Label htmlFor="reminder-toggle" className="text-sm font-medium">
                      Enable Reminder
                    </Label>
                  </div>
                  <Button
                    id="reminder-toggle"
                    type="button"
                    variant={reminderEnabled ? 'default' : 'outline'}
                    size="sm"
                    onClick={handleReminderToggle}
                    className="h-8"
                  >
                    {reminderEnabled ? 'On' : 'Off'}
                  </Button>
                </div>
                
                {reminderEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="reminder-datetime">Reminder Date & Time</Label>
                    <Input
                      id="reminder-datetime"
                      type="datetime-local"
                      value={reminderDateTime}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setReminderDateTime(e.target.value)}
                      className="w-full"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    {reminderDateTime && !isValidReminderTime(reminderDateTime) && (
                      <p className="text-sm text-destructive">
                        Reminder time must be in the future
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Section */}
            <Card>
              <CardHeader>
                <CardTitle>Category</CardTitle>
                <CardDescription>Select a category to organize your task</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(taskCategories).map(([key, config]) => (
                    <Button
                      key={key}
                      variant={category === key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCategory(key as TaskCategory)}
                      className="justify-start"
                    >
                      <div className={`w-3 h-3 rounded-full bg-${config.color}-500 mr-2`} />
                      {config.displayName}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Checklist Section */}
            <Card>
              <CardHeader>
                <CardTitle>Checklist</CardTitle>
                <CardDescription>Break your task into smaller, manageable steps</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Checklist items */}
                {checklist.length > 0 && (
                  <div className="space-y-2 max-h-32 overflow-y-auto mb-3">
                    {checklist.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2 p-2.5 border-2 border-border/40 rounded-lg bg-background/50 hover:bg-muted/30 transition-colors">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggleChecklistItem(item.id)}
                          className="rounded border-gray-300"
                        />
                        <span className={`flex-1 text-sm ${item.done ? 'line-through text-muted-foreground' : ''}`}>
                          {item.text}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeChecklistItem(item.id)}
                          className="h-6 w-6"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add new checklist item */}
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    value={newChecklistItem}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewChecklistItem(e.target.value)}
                    placeholder="Add a checklist item..."
                    onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addChecklistItem()}
                  />
                  <Button size="sm" onClick={addChecklistItem} aria-label="Add checklist item">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}