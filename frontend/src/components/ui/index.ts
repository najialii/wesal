// Centralized exports for all shadcn/ui components
// This allows for cleaner imports: import { Button, Input } from '@/components/ui'

export { Button, buttonVariants } from './button';
export { Input } from './input';
export { Label } from './label';
export { Checkbox } from './checkbox';
export { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from './select';
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';
export { Badge, badgeVariants } from './badge';
export {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from './avatar';
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
export { Alert, AlertDescription, AlertTitle } from './alert';
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
export { Toaster } from './sonner';
export {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './tabs';
export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb';
export { Separator } from './separator';
export { Skeleton } from './skeleton';
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu';

// Utility function re-export
export { cn } from '@/lib/utils';