import { useDirectionClasses } from '@/lib/translation';

export function ProductCardSkeleton() {
  const { isRTL } = useDirectionClasses();
  
  return (
    <div className="group relative flex flex-col h-full animate-pulse">
      {/* Product Image Skeleton */}
      <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-200 relative shadow-md">
        <div className="h-full w-full bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-shimmer" />
        
        {/* Stock Status Badge Skeleton */}
        <div className={`absolute top-2 ${isRTL ? 'right-2' : 'left-2'}`}>
          <div className="h-5 w-16 bg-gray-300 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Product Info Skeleton */}
      <div className={`mt-4 flex ${isRTL ? 'flex-row-reverse' : 'justify-between'} items-start`}>
        <div className={`flex-1 ${isRTL ? 'pl-3' : 'pr-3'}`}>
          {/* Product Name */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-300 rounded w-1/2 animate-pulse" />
          </div>
          
          {/* SKU */}
          <div className="mt-2 h-3 bg-gray-200 rounded w-20 animate-pulse" />
          
          {/* Stock */}
          <div className="mt-1 h-3 bg-gray-200 rounded w-24 animate-pulse" />
        </div>
        
        {/* Price */}
        <div className="h-6 bg-gray-300 rounded w-16 animate-pulse" />
      </div>

      {/* Action Button Skeleton */}
      <div className="mt-4 flex-grow flex flex-col justify-end">
        <div className="w-full h-10 bg-gray-300 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}