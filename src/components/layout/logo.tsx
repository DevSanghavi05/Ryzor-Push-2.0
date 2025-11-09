import { cn } from '@/lib/utils';
import * as React from 'react';

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={cn(className)}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        fill="currentColor"
        d="M20 80 V 20 H 60 L 80 50 L 60 80 H 20 Z M 35 65 V 35 H 50 L 50 50 H 45 V 65 H 35 Z"
      />
    </svg>
  );
}
