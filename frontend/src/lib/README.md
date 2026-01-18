# WesalTech Design System

## Brand Colors

Your platform now uses a unified color system with two primary brand colors:

- **Primary**: `#4f46e5` (Indigo)
- **Secondary**: `#0ea5e9` (Sky Blue)

## Usage

### CSS Variables
```css
:root {
  --color-primary: #4f46e5;
  --color-secondary: #0ea5e9;
}
```

### Tailwind Classes
```tsx
// Primary colors
bg-primary-500     // Background
text-primary-500   // Text
border-primary-500 // Border
hover:bg-primary-600 // Hover states

// Secondary colors  
bg-secondary-500
text-secondary-500
border-secondary-500
hover:bg-secondary-600
```

### Components
```tsx
import { Button, Input, Card } from '../components/ui';

// Primary button (default)
<Button>Save</Button>

// Secondary button
<Button variant="secondary">Cancel</Button>

// Outline button
<Button variant="outline">Edit</Button>

// Input with brand colors
<Input label="Name" placeholder="Enter name" />

// Card component
<Card>Content here</Card>
```

## Color Shades Available

Both primary and secondary colors come with a full range of shades (50-900) for different use cases:

- `50`: Very light backgrounds
- `100-200`: Light backgrounds, subtle borders
- `300-400`: Disabled states, placeholders
- `500`: Main brand color
- `600-700`: Hover states, active elements
- `800-900`: Dark text, high contrast elements

## Implementation Status

✅ **Completed:**
- Tailwind configuration with brand colors
- CSS variables setup
- UI components (Button, Input, Card)
- Login page updated
- Admin and Tenant layouts updated
- All business pages updated (Products, Categories, etc.)
- All blue colors replaced with primary brand colors

The design system is now consistently applied across your entire platform!