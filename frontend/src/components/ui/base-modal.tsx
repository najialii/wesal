import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  className?: string
}

const sizeClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md", 
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl"
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  className,
}: BaseModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(sizeClasses[size], className)}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={onClose}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}