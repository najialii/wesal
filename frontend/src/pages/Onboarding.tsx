import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/lib/translation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Building2, ArrowRight, Loader2, Sparkles 
} from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const { currentLanguage } = useTranslation('common');
  const isRTL = currentLanguage === 'ar';
  
  const [step, setStep] = useState<'welcome' | 'business' | 'branch'>('welcome');
  const [loading, setLoading] = useState(false);
  const [businessData, setBusinessData] = useState({ name: '', phone: '', address: '', tax_number: '' });
  const [branchData, setBranchData] = useState({ 
    name: isRTL ? 'الفرع الرئيسي' : 'Main Branch', 
    code: 'MAIN',
    address: '',
    phone: '',
    city: ''
  });

  const updateOnboardingState = async (optionalPending: boolean) => {
    try {
      // Call backend to mark onboarding as complete
      await api.put('/onboarding/business-setup', {
        business_type: 'small', // Default value
      });
      
      // Update localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.onboarding_completed = true;
        user.onboarding_optional_pending = optionalPending;
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Failed to update onboarding status:', error);
    }
    
    navigate('/business');
  };

  const handleNext = async (action: 'skip' | 'business' | 'complete', payload?: any) => {
    try {
      setLoading(true);
      
      if (action === 'skip') {
        // Just skip to dashboard
        updateOnboardingState(true);
        return;
      }
      
      if (action === 'business') {
        // Update tenant info and mark onboarding complete
        try {
          await api.put('/onboarding/business-setup', {
            business_type: 'small',
            ...payload
          });
          
          // Update localStorage
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            user.onboarding_completed = true;
            localStorage.setItem('user', JSON.stringify(user));
          }
        } catch (err) {
          console.error('Failed to update tenant:', err);
        }
        setStep('branch');
        setLoading(false);
        return;
      }
      
      if (action === 'complete') {
        // Create first branch and mark onboarding complete
        if (branchData.name) {
          try {
            await api.put('/onboarding/business-setup', {
              business_type: 'small',
              branch_name: branchData.name,
              branch_address: branchData.address,
              branch_phone: branchData.phone,
            });
            
            // Update localStorage
            const userStr = localStorage.getItem('user');
            if (userStr) {
              const user = JSON.parse(userStr);
              user.onboarding_completed = true;
              localStorage.setItem('user', JSON.stringify(user));
            }
          } catch (err) {
            console.error('Failed to complete onboarding:', err);
          }
        }
        navigate('/business');
      }
    } catch (error) {
      console.error('Action failed:', error);
      // Continue anyway
      if (action === 'business') {
        setStep('branch');
      } else {
        updateOnboardingState(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 font-sans selection:bg-zinc-900 selection:text-zinc-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-[1100px] mx-auto min-h-screen flex flex-col justify-center px-6 py-12">
        
        {/* Progress Tracker */}
        <div className="flex gap-2 mb-12">
          {['welcome', 'business', 'branch'].map((s) => (
            <div 
              key={s} 
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                step === s ? 'bg-zinc-900' : 'bg-zinc-200'
              }`} 
            />
          ))}
        </div>

        {step === 'welcome' && (
          <div className="grid lg:grid-cols-2 gap-16 items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-[12px] font-medium">
                <Sparkles className="w-3 h-3 text-zinc-500" />
                <span>{isRTL ? 'نظام متكامل' : 'Ready to scale'}</span>
              </div>
              <h1 className="text-5xl font-bold tracking-tight text-zinc-900 leading-[1.1]">
                {isRTL ? 'لنبدأ رحلة النجاح' : 'Build your business engine.'}
              </h1>
              <p className="text-zinc-500 text-lg leading-relaxed">
                {isRTL 
                  ? 'قم بإعداد متجرك في ثوانٍ. منصة مصممة للسرعة والدقة.'
                  : 'Configure your environment in seconds. A platform engineered for speed, reliability, and growth.'}
              </p>
              <Button 
                onClick={() => setStep('business')}
                className="h-12 px-8 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg shadow-sm transition-all"
              >
                {isRTL ? 'ابدأ الآن' : 'Get Started'}
                <ArrowRight className={`w-4 h-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
              </Button>
            </div>
            <div className="hidden lg:block relative aspect-square bg-white border border-zinc-200 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <Building2 className="w-24 h-24 text-zinc-200" />
               </div>
            </div>
          </div>
        )}

        {step === 'business' && (
          <div className="max-w-md mx-auto w-full animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold">{isRTL ? 'بيانات المؤسسة' : 'Business Registry'}</h2>
              <p className="text-zinc-500 text-sm mt-2">{isRTL ? 'يرجى إدخال التفاصيل القانونية' : 'Enter your legal business details'}</p>
            </div>
            
            <div className="space-y-6">
              {[
                { id: 'name', label: isRTL ? 'اسم المنشأة' : 'Entity Name', placeholder: 'e.g. Acme Corp' },
                { id: 'tax_number', label: isRTL ? 'الرقم الضريبي' : 'Tax ID', placeholder: 'Optional' },
                { id: 'phone', label: isRTL ? 'الهاتف' : 'Contact Number', placeholder: '+966' }
              ].map((f) => (
                <div key={f.id} className="space-y-2">
                  <Label htmlFor={f.id} className="text-[13px] font-semibold text-zinc-700">{f.label}</Label>
                  <Input
                    id={f.id}
                    value={(businessData as any)[f.id]}
                    onChange={(e) => setBusinessData({ ...businessData, [f.id]: e.target.value })}
                    placeholder={f.placeholder}
                    className="h-11 border-zinc-200 focus:ring-zinc-900 focus:border-zinc-900 rounded-lg"
                  />
                </div>
              ))}
              <Button 
                onClick={() => handleNext('business', businessData)}
                disabled={!businessData.name || loading}
                className="w-full h-11 bg-zinc-900 mt-4 rounded-lg"
              >
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : (isRTL ? 'التالي' : 'Continue')}
              </Button>
            </div>
          </div>
        )}

        {step === 'branch' && (
          <div className="animate-in fade-in duration-500">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">{isRTL ? 'الفرع الأول' : 'First Branch'}</h2>
              <p className="text-zinc-500 mt-2">{isRTL ? 'أنشئ فرعك الرئيسي' : 'Set up your main location'}</p>
            </div>

            <div className="max-w-xl mx-auto space-y-5">
              {[
                { id: 'name', label: isRTL ? 'اسم الفرع' : 'Branch Name', placeholder: isRTL ? 'الفرع الرئيسي' : 'Main Branch', required: true },
                { id: 'code', label: isRTL ? 'رمز الفرع' : 'Branch Code', placeholder: 'MAIN', required: true },
                { id: 'address', label: isRTL ? 'العنوان' : 'Address', placeholder: isRTL ? 'شارع الملك فهد، الرياض' : 'King Fahd Road, Riyadh' },
                { id: 'city', label: isRTL ? 'المدينة' : 'City', placeholder: isRTL ? 'الرياض' : 'Riyadh' },
                { id: 'phone', label: isRTL ? 'الهاتف' : 'Phone', placeholder: '+966 50 123 4567' },
              ].map((f) => (
                <div key={f.id}>
                  <Label className="text-[13px] font-semibold text-zinc-700 uppercase tracking-wide">
                    {f.label} {f.required && '*'}
                  </Label>
                  <Input
                    value={(branchData as any)[f.id]}
                    onChange={(e) => setBranchData({ ...branchData, [f.id]: e.target.value })}
                    placeholder={f.placeholder}
                    className="h-11 border-zinc-200 focus:ring-zinc-900 focus:border-zinc-900 rounded-lg mt-1.5"
                  />
                </div>
              ))}
              
              <div className="flex flex-col items-center gap-4 pt-4">
                <Button 
                  onClick={() => handleNext('complete')}
                  disabled={!branchData.name || !branchData.code || loading}
                  className="w-full h-12 bg-zinc-900 rounded-lg"
                >
                  {loading ? <Loader2 className="animate-spin w-4 h-4" /> : (isRTL ? 'إكمال الإعداد' : 'Finish Setup')}
                </Button>
                <button 
                  onClick={() => updateOnboardingState(true)}
                  className="text-zinc-400 hover:text-zinc-900 text-xs font-medium underline-offset-4 hover:underline"
                >
                  {isRTL ? 'تخطي للوحة التحكم' : 'Skip to Dashboard'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}