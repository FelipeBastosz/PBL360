import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';
import { OFF_TABLE_DROP } from './dragHandlers';

type OffTableDropZoneProps = {
  studentName: string;
  isHovered: boolean;
};

export function OffTableDropZone({ studentName, isHovered }: OffTableDropZoneProps) {
  return (
    <div
      data-drop={OFF_TABLE_DROP}
      role="status"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-2 border-t-2 border-dashed px-4 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-sm font-semibold transition-colors duration-150 animate-sheet-up lg:hidden',
        isHovered
          ? 'border-danger bg-danger-soft text-danger'
          : 'border-brand-900/40 bg-white/95 text-brand-900 backdrop-blur-xs',
      )}
    >
      <ArrowDownTrayIcon className="size-5" aria-hidden />
      Solte aqui para tirar {studentName} da mesa
    </div>
  );
}
