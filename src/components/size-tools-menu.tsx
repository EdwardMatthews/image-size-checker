import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SIZE_TOOLS = [
  {
    label: '300x300 image converter',
    href: '/300x300-image-converter',
  },
  {
    label: '512x512 image converter',
    href: '/512x512-image-converter',
  },
  {
    label: '64x64 image converter',
    href: '/64x64-image-converter',
  },
];

interface SizeToolsMenuProps {
  active?: boolean;
  compact?: boolean;
}

export function SizeToolsMenu({
  active = false,
  compact = false,
}: SizeToolsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors outline-none hover:bg-indigo-50 hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500/40',
          compact && 'px-2 sm:px-3',
          active
            ? 'bg-slate-950 text-white hover:bg-slate-800 hover:text-white'
            : 'text-slate-600'
        )}
      >
        More size tools
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-xl shadow-slate-900/10"
      >
        {SIZE_TOOLS.map((tool) => (
          <a
            key={tool.href}
            href={tool.href}
            className="block rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-indigo-50 hover:text-indigo-700 focus:bg-indigo-50 focus:text-indigo-700 focus:outline-none"
          >
            {tool.label}
          </a>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
