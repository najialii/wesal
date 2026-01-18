import React, { useState } from 'react';
import { useTranslation } from '@/lib/translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPinIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface BusinessSetupStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData?: any;
}

export const BusinessSetupStep: React.FC<BusinessSetupStepProps> = ({ onNext, onBack }) => {
  const { isRTL } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [branchData, setBranchData] = useState({
    name: '',
    address: '',
    phone: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleBranchDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBranchData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const formData = new FormData();
      formData.append('branch_name', branchData.name || 'Main Branch');
      formData.append('branch_address', branchData.address);
      formData.append('branch_phone', branchData.phone);
      formData.append('business_type', 'small'); // Default business type
      formData.append('_method', 'PUT'); // Laravel method override

      // console.log('Sending branch data:', {
      //   branch_name: branchData.name || 'Main Branch',
      //   branch_address: branchData.address,
      //   branch_phone: branchData.phone,
      //   business_type: 'small',
      //   method: 'POST with _method=PUT'
      // });

      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/onboarding/business-setup`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // console.log('Branch setup successful:', response.data);
      onNext(branchData);
    } catch (error: any) {
      console.error('Branch creation error:', error.response?.data);
      
      if (error.response?.data?.errors) {
        console.log('Validation errors:', error.response.data.errors);
        
        // Handle specific validation errors
        const validationErrors: Record<string, string> = {};
        Object.keys(error.response.data.errors).forEach(key => {
          const errorArray = error.response.data.errors[key];
          validationErrors[key] = Array.isArray(errorArray) ? errorArray[0] : errorArray;
        });
        
        setErrors(validationErrors);
      } else {
        setErrors({ 
          general: error.response?.data?.message || (isRTL ? 'حدث خطأ أثناء الحفظ' : 'An error occurred while saving')
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          {isRTL ? 'إنشاء فرعك الأول' : 'Create Your First Branch'}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {isRTL 
            ? 'أنشئ فرعك الأول وأضف معلومات الموقع'
            : 'Create your first branch and add location details'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Branch Setup */}
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-center mb-4">
            <MapPinIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isRTL ? 'معلومات الفرع' : 'Branch Information'}
            </h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="branch_name" className={`text-gray-700 dark:text-gray-300 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                {isRTL ? 'اسم الفرع' : 'Branch Name'}
              </Label>
              <Input
                id="branch_name"
                name="name"
                type="text"
                placeholder={isRTL ? 'الفرع الرئيسي' : 'Main Branch'}
                value={branchData.name}
                onChange={handleBranchDataChange}
                className={`mt-1 ${isRTL ? 'text-right' : 'text-left'}`}
              />
              {errors.branch_name && <p className="text-sm text-red-500 mt-1">{errors.branch_name}</p>}
            </div>

            <div>
              <Label htmlFor="branch_address" className={`text-gray-700 dark:text-gray-300 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                {isRTL ? 'العنوان' : 'Address'}
              </Label>
              <Input
                id="branch_address"
                name="address"
                type="text"
                placeholder={isRTL ? 'أدخل عنوان الفرع' : 'Enter branch address'}
                value={branchData.address}
                onChange={handleBranchDataChange}
                className={`mt-1 ${isRTL ? 'text-right' : 'text-left'}`}
              />
              {errors.branch_address && <p className="text-sm text-red-500 mt-1">{errors.branch_address}</p>}
            </div>

            <div>
              <Label htmlFor="branch_phone" className={`text-gray-700 dark:text-gray-300 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                {isRTL ? 'رقم الهاتف' : 'Phone Number'}
              </Label>
              <Input
                id="branch_phone"
                name="phone"
                type="tel"
                placeholder={isRTL ? 'أدخل رقم الهاتف' : 'Enter phone number'}
                value={branchData.phone}
                onChange={handleBranchDataChange}
                className={`mt-1 ${isRTL ? 'text-right' : 'text-left'}`}
              />
              {errors.branch_phone && <p className="text-sm text-red-500 mt-1">{errors.branch_phone}</p>}
            </div>
          </div>
        </div>

        {errors.general && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
          </div>
        )}

        {errors.business_type && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">
              <strong>Business Type Error:</strong> {errors.business_type}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1 h-12 text-base border-2"
            disabled={loading}
          >
            {isRTL ? 'رجوع' : 'Back'}
          </Button>
          <Button 
            type="submit" 
            className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-base shadow-lg"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{isRTL ? 'جاري الإنشاء...' : 'Creating...'}</span>
              </div>
            ) : (
              <span>{isRTL ? 'إنشاء الفرع' : 'Create Branch'}</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
