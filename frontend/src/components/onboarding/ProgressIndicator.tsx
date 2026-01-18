import React from 'react';
import { useTranslation } from '@/lib/translation';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
}) => {
  const { t } = useTranslation();

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('onboarding.progress', { interpolation: { current: currentStep, total: totalSteps } })}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {Math.round((currentStep / totalSteps) * 100)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
};
