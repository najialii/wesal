import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/lib/translation';
import axios from 'axios';
import { ModernOnboardingLayout } from '@/components/onboarding/ModernOnboardingLayout';
import { BusinessInfoStep } from './onboarding/BusinessInfoStep';
import { BusinessSetupStep } from './onboarding/BusinessSetupStep';
import { Button } from '@/components/ui/button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function Onboarding() {
  const navigate = useNavigate();
  const { t, isRTL } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});

  const steps = [
    {
      id: 1,
      title: isRTL ? 'معلومات العمل' : 'Business Information',
      description: isRTL ? 'أخبرنا عن عملك' : 'Tell us about your business',
    },
    {
      id: 2,
      title: isRTL ? 'إعداد الفرع' : 'Branch Setup',
      description: isRTL ? 'أنشئ فرعك الأول' : 'Create your first branch',
    },
    {
      id: 3,
      title: isRTL ? 'أهلا وسهلا' : 'Welcome',
      description: isRTL ? 'كل شيء جاهز!' : 'You\'re all set!',
    },
  ];

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        // No token, redirect to login
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/onboarding/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.onboarding_completed) {
        navigate('/business');
        return;
      }

      // If user is logged in but onboarding not complete, start from step 1
      setCurrentStep(1);
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      // If error checking status, redirect to login
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = (stepData: any) => {
    setFormData(prev => ({ ...prev, ...stepData }));
    
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Mark onboarding as complete
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.onboarding_completed = true;
        localStorage.setItem('user', JSON.stringify(user));
      }

      // Redirect to dashboard
      navigate('/business');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{t('loading')}</p>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep - 1];

  return (
    <ModernOnboardingLayout
      currentStep={currentStep}
      totalSteps={steps.length}
      stepTitle={currentStepData.title}
      stepDescription={currentStepData.description}
    >
      {currentStep === 1 && (
        <BusinessInfoStep
          onNext={handleStepComplete}
          onBack={handleStepBack}
          initialData={formData}
        />
      )}
      
      {currentStep === 2 && (
        <BusinessSetupStep
          onNext={handleStepComplete}
          onBack={handleStepBack}
          initialData={formData}
        />
      )}
      
      {currentStep === 3 && (
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isRTL ? 'أهلا وسهلا!' : 'Welcome!'}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {isRTL 
                ? 'تم إعداد عملك بنجاح. يمكنك الآن البدء في استخدام النظام.'
                : 'Your business has been set up successfully. You can now start using the system.'
              }
            </p>
          </div>
          <Button 
            onClick={handleComplete}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-base shadow-lg"
          >
            {isRTL ? 'ابدأ الآن' : 'Get Started'}
          </Button>
        </div>
      )}
    </ModernOnboardingLayout>
  );
}
