import { useDirectionClasses } from '@/lib/translation';

export function CartItemSkeleton() {
  const { isRTL } = useDirectionClasses();
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 animate-pulse">
      <div className={`flex items-start ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
        {/* Product Image Skeleton */}
        <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-gray-200" />
        
        {/* Product Info Skeleton */}
        <div className="flex-1 min-w-0">
          {/* Product Name */}
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-1" />
          
          {/* Price */}
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
          
          {/* Quantity Controls */}
          <div className="flex items-center justify-between">
            <div className="h-8 bg-gray-200 rounded-lg w-24" />
            <div className="h-6 bg-gray-200 rounded w-6" />
          </div>
          
          {/* Item Total */}
          <div className={`mt-2 ${isRTL ? 'text-left' : 'text-right'}`}>
            <div className="h-4 bg-gray-300 rounded w-16 ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CartSkeleton({ itemCount = 3 }: { itemCount?: number }) {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: itemCount }).map((_, index) => (
        <CartItemSkeleton key={index} />
      ))}
    </div>
  );
}