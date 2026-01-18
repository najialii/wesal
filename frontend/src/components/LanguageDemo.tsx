import React from 'react';
import { LanguageSelector } from './LanguageSelector';
import { LanguageToggle } from './LanguageToggle';
import { useTranslation } from '../lib/translation';

export const LanguageDemo: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">{t('labels.language', { fallback: 'Language' })} Options Demo</h2>
        <p className="text-muted-foreground mb-6">
          Choose from different language switching components:
        </p>
      </div>

      <div className="grid gap-6">
        {/* Full Dropdown Selector */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">1. Full Dropdown Selector</h3>
          <p className="text-sm text-muted-foreground">
            Complete dropdown with flags, native names, and language details
          </p>
          <div className="flex items-center gap-4">
            <LanguageSelector variant="dropdown" showFlags={true} />
            <code className="text-xs bg-muted px-2 py-1 rounded">
              &lt;LanguageSelector variant="dropdown" /&gt;
            </code>
          </div>
        </div>

        {/* Inline Language Options */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">2. Inline Language Buttons</h3>
          <p className="text-sm text-muted-foreground">
            Horizontal buttons for each language option
          </p>
          <div className="flex items-center gap-4">
            <LanguageSelector variant="inline" showFlags={true} />
            <code className="text-xs bg-muted px-2 py-1 rounded">
              &lt;LanguageSelector variant="inline" /&gt;
            </code>
          </div>
        </div>

        {/* Simple Toggle Button */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">3. Simple Toggle Button</h3>
          <p className="text-sm text-muted-foreground">
            Quick toggle between English and Arabic with flag and text
          </p>
          <div className="flex items-center gap-4">
            <LanguageToggle variant="button" size="sm" />
            <LanguageToggle variant="button" size="default" />
            <LanguageToggle variant="button" size="lg" />
            <code className="text-xs bg-muted px-2 py-1 rounded">
              &lt;LanguageToggle variant="button" size="sm" /&gt;
            </code>
          </div>
        </div>

        {/* Icon Toggle */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">4. Icon-Only Toggle</h3>
          <p className="text-sm text-muted-foreground">
            Compact globe icon with flag indicator for space-constrained areas
          </p>
          <div className="flex items-center gap-4">
            <LanguageToggle variant="icon" />
            <code className="text-xs bg-muted px-2 py-1 rounded">
              &lt;LanguageToggle variant="icon" /&gt;
            </code>
          </div>
        </div>

        {/* Current Language Display */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Current Language Info</h3>
          <div className="bg-muted p-4 rounded-lg">
            <p><strong>Current Language:</strong> {t('labels.language', { fallback: 'Language' })}</p>
            <p><strong>Sample Text:</strong> {t('navigation.dashboard', { fallback: 'Dashboard' })}</p>
            <p><strong>Button Text:</strong> {t('buttons.save', { fallback: 'Save' })}</p>
            <p><strong>Message:</strong> {t('messages.success', { fallback: 'Success' })}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Usage Recommendations:
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>Dropdown:</strong> Best for headers and settings pages</li>
          <li>• <strong>Inline:</strong> Good for preference pages with space</li>
          <li>• <strong>Toggle Button:</strong> Perfect for quick switching in toolbars</li>
          <li>• <strong>Icon Toggle:</strong> Ideal for mobile or compact layouts</li>
        </ul>
      </div>
    </div>
  );
};