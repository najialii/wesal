export type PasswordStrength = 'weak' | 'medium' | 'strong';

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number;
  feedback: string[];
}

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  let score = 0;
  const feedback: string[] = [];

  // Check length
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password should be at least 8 characters');
  }

  if (password.length >= 12) {
    score += 1;
  }

  // Check for lowercase letters
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add lowercase letters');
  }

  // Check for uppercase letters
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add uppercase letters');
  }

  // Check for numbers
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add numbers');
  }

  // Check for special characters
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add special characters');
  }

  // Determine strength
  let strength: PasswordStrength;
  if (score <= 2) {
    strength = 'weak';
  } else if (score <= 4) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }

  return { strength, score, feedback };
}

export function getStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'bg-red-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'strong':
      return 'bg-green-500';
  }
}

export function getStrengthText(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'Weak';
    case 'medium':
      return 'Medium';
    case 'strong':
      return 'Strong';
  }
}
