import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useModalState } from '@/contexts/ModalContext';
import { SettingsView } from './SettingsView';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export function SettingsModal({ isOpen, onClose, children }: SettingsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="p-0 gap-0 flex flex-col max-w-4xl w-full h-full md:h-[85vh] max-h-[90vh] bg-background border-border/20 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/10 bg-background/95 backdrop-blur-sm shrink-0">
          <h1 className="text-lg font-medium text-foreground">Settings</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SettingsView />
        </div>
      </DialogContent>
    </Dialog>
  );
}