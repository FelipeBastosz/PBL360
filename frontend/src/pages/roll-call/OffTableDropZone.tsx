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
        'fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-2 border-t-2 border-dashed px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] text-sm font-semibold transition-colors duration-150 animate-sheet-up lg:hidden [@media(max-height:560px)]:pt-1.5 [@media(max-height:560px)]:pb-[max(0.375rem,env(safe-area-inset-bottom))] [@media(max-height:560px)]:text-xs',
        isHovered
          ? 'border-danger bg-danger-soft text-danger'
          : 'border-brand-accent/40 bg-elevated/95 text-brand-accent backdrop-blur-xs',
      )}
    >
      <ArrowDownTrayIcon className="size-5" aria-hidden />
      Solte aqui para tirar {studentName} da mesa
    </div>
  );
}
