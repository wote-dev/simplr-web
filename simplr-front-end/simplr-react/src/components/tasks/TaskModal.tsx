import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { X, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import type { Task, TaskCategory, ChecklistItem } from '@/types';
import { taskCategories } from '@/hooks/useTasks';

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

  // Update form state when task prop changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setCategory(task.category || 'PERSONAL');
      setDueDate(task.dueDate || '');
      setChecklist(task.checklist || []);
    } else {
      // Reset form for new task
      setTitle('');
      setDescription('');
      setCategory('PERSONAL');
      setDueDate('');
      setChecklist([]);
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
    if (!title.trim()) return;

    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        category,
        dueDate,
        checklist,
        completed: task?.completed || false,
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

  // Keyboard event handlers
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
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
          
          <div className="space-y-5">
            {/* Task Details Section */}
            <fieldset className="space-y-4 p-3 bg-muted/20 rounded-lg border border-border/30">
              <legend className="mb-2 px-2">
                <h4 className="text-sm font-semibold text-foreground mb-0.5">Task Details</h4>
                <p className="text-xs text-muted-foreground/80">Give your task a clear title and optional description</p>
              </legend>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Complete quarterly report"
                  className="w-full px-3 py-2.5 border-2 border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors shadow-sm"
                  autoFocus
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add context, requirements, or notes..."
                  rows={3}
                  className="w-full px-3 py-2.5 border-2 border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors resize-none shadow-sm"
                />
              </div>
            </fieldset>

            {/* Due Date Section */}
            <fieldset className="space-y-3 p-3 bg-muted/20 rounded-lg border border-border/30">
              <legend className="mb-2 px-2">
                <h4 className="text-sm font-semibold text-foreground mb-0.5">Due Date</h4>
                <p className="text-xs text-muted-foreground/80">Set when this task should be completed</p>
              </legend>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Due Date</label>
                <DatePicker
                  date={dueDate ? new Date(dueDate) : undefined}
                  onDateChange={(date) => setDueDate(date ? date.toISOString() : '')}
                  placeholder="Select due date"
                />
              </div>
            </fieldset>

            {/* Category Section */}
            <fieldset className="space-y-3 p-3 bg-muted/20 rounded-lg border border-border/30">
              <legend className="mb-2 px-2">
                <h4 className="text-sm font-semibold text-foreground mb-0.5">Category</h4>
                <p className="text-xs text-muted-foreground/80">Select a category to organize your task</p>
              </legend>
              
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
            </fieldset>

            {/* Checklist Section */}
            <fieldset className="space-y-3 p-3 bg-muted/20 rounded-lg border border-border/30">
              <legend className="mb-2 px-2">
                <h4 className="text-sm font-semibold text-foreground mb-0.5">Check List</h4>
                <p className="text-xs text-muted-foreground/80">Break your task into smaller, manageable steps</p>
              </legend>
              
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
                <input
                  type="text"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  placeholder="Add a checklist item..."
                  className="flex-1 px-3 py-2.5 border-2 border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors shadow-sm"
                  onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
                />
                <Button size="sm" onClick={addChecklistItem} aria-label="Add checklist item">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </fieldset>
          </div>
        </div>
      </div>
    </div>
  );
}