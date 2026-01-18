import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FullscreenLayoutProps {
  title?: string;
  showBackButton?: boolean;
  showCloseButton?: boolean;
  backUrl?: string;
  onClose?: () => void;
}

export default function FullscreenLayout({ 
  title,
  showBackButton = true,
  showCloseButton = false,
  backUrl,
  onClose
}: FullscreenLayoutProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-8 w-8"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span className="sr-only">Go back</span>
              </Button>
            )}
            {title && (
              <h1 className="text-lg font-semibold">{title}</h1>
            )}
          </div>
          
          {showCloseButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <XMarkIcon className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}