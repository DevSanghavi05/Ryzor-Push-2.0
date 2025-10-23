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
      <defs>
        <linearGradient
          id="logo-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))' }} />
          <stop
            offset="100%"
            style={{ stopColor: 'hsl(var(--accent))' }}
          />
        </linearGradient>
      </defs>
      <path
        fill="url(#logo-gradient)"
        d="M26.6,80 L26.6,33.3 C26.6,26.6 33.3,20 40,20 L60,20 L80,40 L60,40 L60,60 L80,60 L60,80 L26.6,80 Z"
      />
    </svg>
  );
}
