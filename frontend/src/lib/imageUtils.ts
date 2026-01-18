// Extract the base URL from the API configuration
import api from './api';

// Get the base URL from the axios instance, removing '/api' suffix
const getApiBaseUrl = (): string => {
  const baseURL = api.defaults.baseURL || 'http://127.0.0.1:8000/api';
  return baseURL.replace('/api', '');
};

export function getImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) {
    return '';
  }

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  const apiBaseUrl = getApiBaseUrl();

  // If it starts with /storage/, it's a Laravel storage path
  if (imagePath.startsWith('/storage/')) {
    return `${apiBaseUrl}${imagePath}`;
  }

  // If it starts with /, treat it as an absolute path from the API base
  if (imagePath.startsWith('/')) {
    return `${apiBaseUrl}${imagePath}`;
  }

  // Otherwise, assume it's a relative path and prepend the storage path
  return `${apiBaseUrl}/storage/${imagePath}`;
}

export function getProductImageUrl(product: { image?: string; name: string }): string {
  if (product.image) {
    const imageUrl = getImageUrl(product.image);
    // Add some debugging
    console.log('Product image URL:', { 
      originalPath: product.image, 
      constructedUrl: imageUrl,
      productName: product.name 
    });
    return imageUrl;
  }

  // Generate a placeholder image using the product name
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&size=128&background=f3f4f6&color=6b7280&format=png`;
}