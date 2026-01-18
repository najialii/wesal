import { Outlet } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from './Container';

interface AuthLayoutProps {
  title?: string;
  description?: string;
}

export default function AuthLayout({ title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Container size="sm" className="w-full max-w-md">
        <div className="flex flex-col items-center space-y-6">
          {/* Logo/Branding */}
          <div className="flex flex-col items-center space-y-2">
            <img 
              src="/1.svg" 
              alt="WesalTech Logo" 
              className="h-20 w-auto"
            />
            <p className="text-sm text-muted-foreground text-center">
              Business Management Platform
            </p>
          </div>

          {/* Auth Card */}
          <Card className="w-full shadow-lg border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
              {title && <CardTitle className="text-xl">{title}</CardTitle>}
              {description && (
                <CardDescription className="text-muted-foreground">
                  {description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Outlet />
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground">
            <p>© 2024 WesalTech. All rights reserved.</p>
          </div>
        </div>
      </Container>
    </div>
  );
}