import { 
  Dialog, 
  DialogContent, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { SettingsView } from './SettingsView';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export function SettingsModal({ isOpen, onClose, children }: SettingsModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        {children && <DialogTrigger asChild>{children}</DialogTrigger>}
        <DialogContent className="max-w-5xl w-full h-[80vh] max-h-[95vh] overflow-hidden p-0 gap-0 bg-background border border-border/20 shadow-2xl">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/10 bg-background/95 backdrop-blur-sm">
              <h1 className="text-lg font-medium text-foreground">Settings</h1>
            </div>
            <div className="flex-1 overflow-hidden">
              <SettingsView />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
      <SheetContent side="left" className="p-0 gap-0 border-r-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/10 bg-background/95 backdrop-blur-sm">
            <h1 className="text-lg font-medium text-foreground">Settings</h1>
          </div>
          <div className="flex-1 overflow-hidden">
            <SettingsView />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}