import { useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import api from '../../lib/api';
import { toast } from 'sonner';

interface SystemSetting {
  id: number;
  key: string;
  value: any;
  category: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  description?: string;
  is_public: boolean;
  updated_by?: {
    id: number;
    name: string;
  };
  updated_at: string;
}

interface SettingsData {
  settings: Record<string, SystemSetting[]>;
  categories: string[];
}

const TypeBadge = ({ type }: { type: string }) => {
  const colors = {
    string: 'default',
    number: 'secondary',
    boolean: 'outline',
    json: 'destructive',
    array: 'secondary',
  } as const;

  return (
    <Badge variant={colors[type as keyof typeof colors] || 'default'}>
      {type}
    </Badge>
  );
};

const SettingForm = ({ 
  setting, 
  onSave, 
  onCancel 
}: { 
  setting?: SystemSetting; 
  onSave: (data: any) => void; 
  onCancel: () => void; 
}) => {
  const [formData, setFormData] = useState({
    key: setting?.key || '',
    value: setting?.value || '',
    category: setting?.category || 'application',
    type: setting?.type || 'string',
    description: setting?.description || '',
    is_public: setting?.is_public || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="key">Setting Key</Label>
          <Input
            id="key"
            value={formData.key}
            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
            placeholder="app.setting_name"
            required
            disabled={!!setting}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="application">Application</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="features">Features</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="string">String</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="boolean">Boolean</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="array">Array</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2 pt-6">
          <Switch
            id="is_public"
            checked={formData.is_public}
            onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
          />
          <Label htmlFor="is_public">Public Setting</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">Setting Value</Label>
        {formData.type === 'boolean' ? (
          <Switch
            checked={formData.value === true || formData.value === 'true'}
            onCheckedChange={(checked) => setFormData({ ...formData, value: checked })}
          />
        ) : formData.type === 'json' || formData.type === 'array' ? (
          <Textarea
            id="value"
            value={typeof formData.value === 'object' ? JSON.stringify(formData.value, null, 2) : formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            placeholder={formData.type === 'json' ? '{"key": "value"}' : '["item1", "item2"]'}
            rows={4}
            required
          />
        ) : (
          <Input
            id="value"
            type={formData.type === 'number' ? 'number' : 'text'}
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            required
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description of this setting..."
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {setting ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};

export default function Settings() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search] = useState('');
  const [selectedCategory] = useState('all');
  const [selectedType] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [selectedCategory, selectedType, search]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (search) params.append('search', search);

      const response = await api.get(`/admin/settings?${params}`);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('An error occurred while loading settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSetting = async (formData: any) => {
    try {
      await api.post('/admin/settings', formData);
      toast.success('Setting created successfully');
      setIsCreateModalOpen(false);
      fetchSettings();
    } catch (error) {
      console.error('Failed to create setting:', error);
      toast.error('Failed to create setting');
    }
  };

  const handleUpdateSetting = async (formData: any) => {
    try {
      await api.put('/admin/settings', {
        settings: [{ key: formData.key, value: formData.value }]
      });
      toast.success('Setting updated successfully');
      setEditingSetting(null);
      fetchSettings();
    } catch (error) {
      console.error('Failed to update setting:', error);
      toast.error('Failed to update setting');
    }
  };

  const handleDeleteSetting = async (key: string) => {
    if (!confirm('Are you sure you want to delete this setting?')) return;

    try {
      await api.delete(`/admin/settings/${key}`);
      toast.success('Setting deleted successfully');
      fetchSettings();
    } catch (error) {
      console.error('Failed to delete setting:', error);
      toast.error('Failed to delete setting');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <AlertDescription>
            An error occurred while loading settings
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const allSettings = Object.values(data.settings).flat();
  let filteredSettings = selectedCategory === 'all' 
    ? allSettings 
    : data.settings[selectedCategory] || [];

  if (selectedType !== 'all') {
    filteredSettings = filteredSettings.filter(setting => setting.type === selectedType);
  }

  if (search) {
    filteredSettings = filteredSettings.filter(setting => 
      setting.key.toLowerCase().includes(search.toLowerCase()) ||
      setting.description?.toLowerCase().includes(search.toLowerCase()) ||
      String(setting.value).toLowerCase().includes(search.toLowerCase())
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage system settings and configuration</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Setting
          </Button>
        </div>
      </div>

      {/* Settings Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>
            {filteredSettings.length} settings
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Setting Key</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSettings.map((setting) => (
                <TableRow key={setting.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{setting.key}</div>
                      {setting.description && (
                        <div className="text-sm text-muted-foreground">{setting.description}</div>
                      )}
                      {setting.is_public && (
                        <Badge variant="outline" className="text-xs">Public</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {typeof setting.value === 'object' 
                        ? JSON.stringify(setting.value) 
                        : String(setting.value)
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{setting.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <TypeBadge type={setting.type} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="text-sm">
                      {new Date(setting.updated_at).toLocaleDateString()}
                    </div>
                    {setting.updated_by && (
                      <div className="text-xs text-muted-foreground">
                        by {setting.updated_by.name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSetting(setting)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSetting(setting.key)}
                        className="text-destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Setting Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Setting</DialogTitle>
            <DialogDescription>
              Create a new system setting
            </DialogDescription>
          </DialogHeader>
          <SettingForm
            onSave={handleCreateSetting}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Setting Modal */}
      <Dialog open={!!editingSetting} onOpenChange={() => setEditingSetting(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Setting</DialogTitle>
            <DialogDescription>
              Update setting: {editingSetting?.key}
            </DialogDescription>
          </DialogHeader>
          {editingSetting && (
            <SettingForm
              setting={editingSetting}
              onSave={handleUpdateSetting}
              onCancel={() => setEditingSetting(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}