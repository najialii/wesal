import * as React from "react"
import { BaseModal } from "@/components/ui/base-modal"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface FormModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  onSubmit?: () => void | Promise<void>
  loading?: boolean
  submitText?: string
  cancelText?: string
  submitDisabled?: boolean
  className?: string
}

export function FormModal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  onSubmit,
  loading = false,
  submitText = "Save",
  cancelText = "Cancel",
  submitDisabled = false,
  className,
}: FormModalProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit && !loading) {
      await onSubmit()
    }
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      className={className}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {children}
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          {onSubmit && (
            <Button
              type="submit"
              disabled={loading || submitDisabled}
              className="min-w-[100px]"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitText}
            </Button>
          )}
        </DialogFooter>
      </form>
    </BaseModal>
  )
}