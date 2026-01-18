import { describe, it, expect } from 'vitest';
import arStaffTranslations from '../../../locales/ar/staff.json';
import enStaffTranslations from '../../../locales/en/staff.json';

/**
 * Feature: staff-localization-and-role-restriction
 * Property 5: Translation completeness
 * 
 * For any required staff management translation key, both Arabic and English 
 * translation files should contain the key with appropriate translations
 */
describe('Property 5: Translation Completeness', () => {
  const requiredKeys = [
    'title',
    'staff',
    'create',
    'edit',
    'name',
    'email',
    'role',
    'save',
    'cancel',
    'loading',
    'statistics.total',
    'statistics.admins', 
    'statistics.salesmen',
    'form.name',
    'form.email',
    'form.role',
    'form.submit',
    'form.cancel',
    'validation.nameRequired',
    'validation.emailRequired',
    'validation.roleRequired',
    'validation.roleRestricted',
    'notifications.createSuccess',
    'notifications.createError',
    'notifications.updateSuccess',
    'notifications.updateError',
    'notifications.deleteSuccess',
    'notifications.deleteError',
    'roles.salesman',
    'roles.manager',
    'roles.tenant_admin',
    'table.name',
    'table.email',
    'table.role',
    'table.actions',
    'buttons.add',
    'buttons.edit',
    'buttons.delete',
    'buttons.save',
    'buttons.cancel',
    'modals.createTitle',
    'modals.editTitle',
    'modals.deleteTitle',
    'modals.deleteMessage'
  ];

  it('should have all required keys in Arabic translations', () => {
    requiredKeys.forEach(key => {
      const value = getNestedValue(arStaffTranslations, key);
      expect(value).toBeDefined();
      expect(typeof value).toBe('string');
      expect(value.trim()).not.toBe('');
    });
  });

  it('should have all required keys in English translations', () => {
    requiredKeys.forEach(key => {
      const value = getNestedValue(enStaffTranslations, key);
      expect(value).toBeDefined();
      expect(typeof value).toBe('string');
      expect(value.trim()).not.toBe('');
    });
  });

  it('should have matching key structure between Arabic and English', () => {
    const arKeys = getAllKeys(arStaffTranslations);
    const enKeys = getAllKeys(enStaffTranslations);
    
    // Check that all Arabic keys exist in English
    arKeys.forEach(key => {
      expect(enKeys).toContain(key);
    });
    
    // Check that all English keys exist in Arabic
    enKeys.forEach(key => {
      expect(arKeys).toContain(key);
    });
  });

  it('should have proper Arabic translations for role names', () => {
    expect(arStaffTranslations.roles.salesman).toBe('بائع');
    expect(arStaffTranslations.roles.tenant_admin).toBe('مدير المستأجر');
    expect(arStaffTranslations.roles.manager).toBe('مدير');
  });

  it('should have proper English translations for role names', () => {
    expect(enStaffTranslations.roles.salesman).toBe('Salesman');
    expect(enStaffTranslations.roles.tenant_admin).toBe('Tenant Admin');
    expect(enStaffTranslations.roles.manager).toBe('Manager');
  });

  it('should have role restriction validation message in both languages', () => {
    expect(arStaffTranslations.validation.roleRestricted).toBe('يُسمح بدور البائع فقط');
    expect(enStaffTranslations.validation.roleRestricted).toBe('Only salesman role is allowed');
  });

  it('should have consistent statistics keys in both languages', () => {
    const statisticsKeys = ['total', 'admins', 'salesmen'];
    
    statisticsKeys.forEach(key => {
      expect(arStaffTranslations.statistics[key]).toBeDefined();
      expect(enStaffTranslations.statistics[key]).toBeDefined();
      expect(typeof arStaffTranslations.statistics[key]).toBe('string');
      expect(typeof enStaffTranslations.statistics[key]).toBe('string');
    });
  });

  it('should have all form validation messages in both languages', () => {
    const validationKeys = ['nameRequired', 'emailRequired', 'roleRequired', 'roleRestricted'];
    
    validationKeys.forEach(key => {
      expect(arStaffTranslations.validation[key]).toBeDefined();
      expect(enStaffTranslations.validation[key]).toBeDefined();
      expect(typeof arStaffTranslations.validation[key]).toBe('string');
      expect(typeof enStaffTranslations.validation[key]).toBe('string');
    });
  });

  it('should have all notification messages in both languages', () => {
    const notificationKeys = [
      'createSuccess', 'createError', 'updateSuccess', 
      'updateError', 'deleteSuccess', 'deleteError'
    ];
    
    notificationKeys.forEach(key => {
      expect(arStaffTranslations.notifications[key]).toBeDefined();
      expect(enStaffTranslations.notifications[key]).toBeDefined();
      expect(typeof arStaffTranslations.notifications[key]).toBe('string');
      expect(typeof enStaffTranslations.notifications[key]).toBe('string');
    });
  });
});

// Helper function to get nested object values by dot notation
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Helper function to get all keys from nested object
function getAllKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys = keys.concat(getAllKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }
  
  return keys;
}