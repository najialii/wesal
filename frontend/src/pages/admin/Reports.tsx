import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Download, 
  Filter,
  Clock,
  Settings,
  Play,
  Pause,
  Trash2,
  Eye,
  RefreshCw,
  Plus,
  Search,
  FileDown,
  History,
  TrendingUp
} from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  data_source: string;
  fields: string[];
}

interface ReportHistory {
  id: string;
  template: string;
  generated_at: string;
  parameters: Record<string, any>;
  status: 'completed' | 'failed' | 'processing';
  file_size: string;
  download_count: number;
}

interface ScheduledReport {
  id: string;
  template: string;
  schedule: string;
  next_run: string;
  status: 'scheduled' | 'paused' | 'failed';
  parameters: Record<string, any>;
}

interface ReportStatistics {
  total_reports_generated: number;
  reports_this_month: number;
  most_popular_template: string;
  total_downloads: number;
  average_generation_time: string;
  templates_usage: Record<string, number>;
  format_preferences: Record<string, number>;
  scheduled_reports_active: number;
  last_generated: string;
}

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'scheduled' | 'history' | 'statistics'>('generate');
  const [templates, setTemplates] = useState<Record<string, ReportTemplate>>({});
  const [supportedFormats, setSupportedFormats] = useState<string[]>([]);
  const [history, setHistory] = useState<ReportHistory[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [statistics, setStatistics] = useState<ReportStatistics | null>(null);
  const [generating, setGenerating] = useState(false);

  // Report generation form state
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [reportParameters, setReportParameters] = useState({
    start_date: '',
    end_date: '',
    format: 'csv',
    limit: 1000,
    sort_by: '',
    sort_order: 'asc',
  });

  // Scheduling form state
  const [scheduleForm, setScheduleForm] = useState({
    template: '',
    schedule: '0 9 * * *', // Daily at 9 AM
    parameters: {},
  });

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/reports/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch templates');

      const data = await response.json();
      setTemplates(data.templates);
      setSupportedFormats(data.supported_formats);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/reports/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch history');

      const data = await response.json();
      setHistory(data.history);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  }, []);

  const fetchScheduledReports = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/reports/scheduled', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch scheduled reports');

      const data = await response.json();
      setScheduledReports(data.scheduled_reports);
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
    }
  }, []);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/reports/statistics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch statistics');

      const data = await response.json();
      setStatistics(data.statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchHistory();
    fetchScheduledReports();
    fetchStatistics();
  }, [fetchTemplates, fetchHistory, fetchScheduledReports, fetchStatistics]);

  const handleGenerateReport = async () => {
    if (!selectedTemplate) return;

    setGenerating(true);
    try {
      const response = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          template: selectedTemplate,
          parameters: reportParameters,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate report');

      await response.json();
      
      // Refresh history after successful generation
      fetchHistory();
      
      alert('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportReport = async (format: string) => {
    if (!selectedTemplate) return;

    try {
      const response = await fetch('/api/admin/reports/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: selectedTemplate,
          format: format,
          parameters: reportParameters,
        }),
      });

      if (!response.ok) throw new Error('Failed to export report');

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTemplate}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    }
  };

  const handleScheduleReport = async () => {
    try {
      const response = await fetch('/api/admin/reports/schedule', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(scheduleForm),
      });

      if (!response.ok) throw new Error('Failed to schedule report');

      fetchScheduledReports();
      alert('Report scheduled successfully!');
      
      // Reset form
      setScheduleForm({
        template: '',
        schedule: '0 9 * * *',
        parameters: {},
      });
    } catch (error) {
      console.error('Error scheduling report:', error);
      alert('Failed to schedule report');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'scheduled': return 'text-blue-600 bg-blue-50';
      case 'paused': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatSchedule = (schedule: string) => {
    // Simple schedule formatter - in reality, you'd use a cron parser
    switch (schedule) {
      case '0 9 * * *': return 'Daily at 9:00 AM';
      case '0 10 * * 1': return 'Weekly on Monday at 10:00 AM';
      case '0 9 1 * *': return 'Monthly on 1st at 9:00 AM';
      default: return schedule;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Report Management
          </h1>
          <p className="text-gray-600 mt-1">
            Generate, schedule, and manage system reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              fetchHistory();
              fetchScheduledReports();
              fetchStatistics();
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'generate', label: 'Generate Reports', icon: FileText },
            { id: 'scheduled', label: 'Scheduled Reports', icon: Clock },
            { id: 'history', label: 'Report History', icon: History },
            { id: 'statistics', label: 'Statistics', icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Generate Reports Tab */}
      {activeTab === 'generate' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Report Configuration */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Generate New Report</h3>
            
            <div className="space-y-4">
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium mb-1">Report Template</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a template...</option>
                  {Object.entries(templates).map(([key, template]) => (
                    <option key={key} value={key}>
                      {template.name}
                    </option>
                  ))}
                </select>
                {selectedTemplate && templates[selectedTemplate] && (
                  <p className="text-sm text-gray-600 mt-1">
                    {templates[selectedTemplate].description}
                  </p>
                )}
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={reportParameters.start_date}
                    onChange={(e) => setReportParameters(prev => ({
                      ...prev,
                      start_date: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <Input
                    type="date"
                    value={reportParameters.end_date}
                    onChange={(e) => setReportParameters(prev => ({
                      ...prev,
                      end_date: e.target.value
                    }))}
                  />
                </div>
              </div>

              {/* Format and Limit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Export Format</label>
                  <select
                    value={reportParameters.format}
                    onChange={(e) => setReportParameters(prev => ({
                      ...prev,
                      format: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {supportedFormats.map(format => (
                      <option key={format} value={format}>
                        {format.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Record Limit</label>
                  <Input
                    type="number"
                    min="1"
                    max="10000"
                    value={reportParameters.limit}
                    onChange={(e) => setReportParameters(prev => ({
                      ...prev,
                      limit: parseInt(e.target.value) || 1000
                    }))}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleGenerateReport}
                  disabled={!selectedTemplate || generating}
                  className="flex items-center gap-2"
                >
                  {generating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {generating ? 'Generating...' : 'Generate Report'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleExportReport(reportParameters.format)}
                  disabled={!selectedTemplate}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Directly
                </Button>
              </div>
            </div>
          </Card>

          {/* Available Templates */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Available Templates</h3>
            
            <div className="space-y-3">
              {Object.entries(templates).map(([key, template]) => (
                <div
                  key={key}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTemplate === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTemplate(key)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {template.data_source}
                        </span>
                        <span className="text-xs text-gray-500">
                          {template.fields.length} fields
                        </span>
                      </div>
                    </div>
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Scheduled Reports Tab */}
      {activeTab === 'scheduled' && (
        <div className="space-y-6">
          {/* Schedule New Report */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Schedule New Report</h3>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Template</label>
                <select
                  value={scheduleForm.template}
                  onChange={(e) => setScheduleForm(prev => ({
                    ...prev,
                    template: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select template...</option>
                  {Object.entries(templates).map(([key, template]) => (
                    <option key={key} value={key}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Schedule</label>
                <select
                  value={scheduleForm.schedule}
                  onChange={(e) => setScheduleForm(prev => ({
                    ...prev,
                    schedule: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="0 9 * * *">Daily at 9:00 AM</option>
                  <option value="0 10 * * 1">Weekly on Monday at 10:00 AM</option>
                  <option value="0 9 1 * *">Monthly on 1st at 9:00 AM</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={handleScheduleReport}
                  disabled={!scheduleForm.template}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Schedule Report
                </Button>
              </div>
            </div>
          </Card>

          {/* Scheduled Reports List */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Scheduled Reports</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Template</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Schedule</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Next Run</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledReports.map((report) => (
                    <tr key={report.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{report.template}</div>
                          <div className="text-sm text-gray-500">ID: {report.id}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{formatSchedule(report.schedule)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">
                          {new Date(report.next_run).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                          {report.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Pause className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Report History</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search reports..."
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Template</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Generated</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Size</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Downloads</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((report) => (
                  <tr key={report.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{report.template}</div>
                        <div className="text-sm text-gray-500">ID: {report.id}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">
                        {new Date(report.generated_at).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{report.file_size}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{report.download_count}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileDown className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Statistics Tab */}
      {activeTab === 'statistics' && statistics && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Overview Stats */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Reports</span>
                <span className="font-semibold">{statistics.total_reports_generated}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">This Month</span>
                <span className="font-semibold">{statistics.reports_this_month}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Downloads</span>
                <span className="font-semibold">{statistics.total_downloads}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg Generation Time</span>
                <span className="font-semibold">{statistics.average_generation_time}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Scheduled</span>
                <span className="font-semibold">{statistics.scheduled_reports_active}</span>
              </div>
            </div>
          </Card>

          {/* Template Usage */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Template Usage</h3>
            <div className="space-y-3">
              {Object.entries(statistics.templates_usage).map(([template, count]) => (
                <div key={template} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 capitalize">
                    {template.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ 
                          width: `${(count / Math.max(...Object.values(statistics.templates_usage))) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Format Preferences */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Format Preferences</h3>
            <div className="space-y-3">
              {Object.entries(statistics.format_preferences).map(([format, count]) => (
                <div key={format} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 uppercase">{format}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ 
                          width: `${(count / Math.max(...Object.values(statistics.format_preferences))) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Reports;