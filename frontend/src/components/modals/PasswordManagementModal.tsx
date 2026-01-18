import { useState } from 'react';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  ClipboardDocumentIcon,
  ArrowPathIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface PasswordManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  currentPassword?: string;
  onGeneratePassword: () => Promise<string>;
  onSavePassword?: (password: string) => Promise<void>;
  showSaveButton?: boolean;
}

export default function PasswordManagementModal({
  isOpen,
  onClose,
  title,
  description,
  currentPassword = '',
  onGeneratePassword,
  onSavePassword,
  showSaveButton = false
}: PasswordManagementModalProps) {
  const [password, setPassword] = useState(currentPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGeneratePassword = async () => {
    try {
      setIsGenerating(true);
      const newPassword = await onGeneratePassword();
      setPassword(newPassword);
      toast.success('New password generated successfully');
    } catch (error) {
      console.error('Failed to generate password:', error);
      toast.error('Failed to generate password');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPassword = async () => {
    if (!password) return;
    
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast.success('Password copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy password:', error);
      toast.error('Failed to copy password');
    }
  };

  const handleSavePassword = async () => {
    if (!onSavePassword || !password) return;
    
    try {
      setIsSaving(true);
      await onSavePassword(password);
      toast.success('Password saved successfully');
      onClose();
    } catch (error) {
      console.error('Failed to save password:', error);
      toast.error('Failed to save password');
    } finally {
      setIsSaving(false);
    }
  };

  const generateRandomPassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  };

  const handleLocalGenerate = () => {
    const newPassword = generateRandomPassword();
    setPassword(newPassword);
    toast.success('Password generated locally');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-20"
                placeholder="Generated password will appear here"
              />
              <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="h-8 w-8 p-0"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPassword}
                  disabled={!password}
                  className="h-8 w-8 p-0"
                >
                  {copied ? (
                    <CheckIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleGeneratePassword}
              disabled={isGenerating}
              className="flex-1"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Server Password'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleLocalGenerate}
              className="flex-1"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Generate Local
            </Button>
          </div>

          <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
            <strong>Security Tips:</strong>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Copy the password before closing this dialog</li>
              <li>Share the password securely with the admin user</li>
              <li>Advise the admin to change the password after first login</li>
              <li>Server passwords are logged for audit purposes</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {showSaveButton && (
              <Button 
                onClick={handleSavePassword}
                disabled={!password || isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Password'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}