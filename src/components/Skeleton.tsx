import React from 'react';

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-zinc-900 ${className}`} />
);

export const ProductCardSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="aspect-[4/5] w-full" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  </div>
);

export const ProductDetailSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
    <div className="flex flex-col lg:flex-row gap-12">
      <Skeleton className="lg:w-1/2 aspect-[4/5]" />
      <div className="lg:w-1/2 space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="flex space-x-4">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-12 flex-grow" />
        </div>
      </div>
    </div>
  </div>
);
