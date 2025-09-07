import * as React from "react"
import { Button } from "@/components/ui/button"

interface AlertDialogProps {
  open: boolean
  children: React.ReactNode
}

interface AlertDialogContentProps {
  children: React.ReactNode
  className?: string
}

interface AlertDialogHeaderProps {
  children: React.ReactNode
}

interface AlertDialogTitleProps {
  children: React.ReactNode
}

interface AlertDialogDescriptionProps {
  children: React.ReactNode
}

interface AlertDialogFooterProps {
  children: React.ReactNode
}

interface AlertDialogActionProps {
  onClick?: () => void
  children: React.ReactNode
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

interface AlertDialogCancelProps {
  onClick?: () => void
  children: React.ReactNode
}

const AlertDialog = ({ open, children }: AlertDialogProps) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0 duration-300">
      <div className="relative">
        {children}
      </div>
    </div>
  )
}

const AlertDialogContent = ({ children, className = "" }: AlertDialogContentProps) => {
  return (
    <div className={`bg-background rounded-lg shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4 duration-300 ${className}`}>
      {children}
    </div>
  )
}

const AlertDialogHeader = ({ children }: AlertDialogHeaderProps) => {
  return (
    <div className="px-6 py-4 border-b border-border">
      {children}
    </div>
  )
}

const AlertDialogTitle = ({ children }: AlertDialogTitleProps) => {
  return (
    <h2 className="text-lg font-semibold text-foreground">
      {children}
    </h2>
  )
}

const AlertDialogDescription = ({ children }: AlertDialogDescriptionProps) => {
  return (
    <p className="text-sm text-muted-foreground mt-2">
      {children}
    </p>
  )
}

const AlertDialogFooter = ({ children }: AlertDialogFooterProps) => {
  return (
    <div className="px-6 py-4 flex justify-end space-x-2">
      {children}
    </div>
  )
}

const AlertDialogAction = ({ onClick, children, variant = "default" }: AlertDialogActionProps) => {
  return (
    <Button onClick={onClick} variant={variant}>
      {children}
    </Button>
  )
}

const AlertDialogCancel = ({ onClick, children }: AlertDialogCancelProps) => {
  return (
    <Button onClick={onClick} variant="outline">
      {children}
    </Button>
  )
}

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
}