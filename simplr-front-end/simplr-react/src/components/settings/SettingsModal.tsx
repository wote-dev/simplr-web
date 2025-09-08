import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { SettingsView } from './SettingsView';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0 gap-0 bg-background border border-border/20 shadow-2xl">
        {/* Clean, minimal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/10 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-medium text-foreground">Settings</h1>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          <SettingsView />
        </div>
      </DialogContent>
    </Dialog>
  );
}