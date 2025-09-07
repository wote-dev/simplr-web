import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SettingsView } from './SettingsView';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <SettingsView />
        </div>
      </DialogContent>
    </Dialog>
  );
}