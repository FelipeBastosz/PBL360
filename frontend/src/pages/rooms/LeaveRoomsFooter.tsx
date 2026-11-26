import { Button } from '@/components/ui/Button';

export function LeaveRoomsFooter({ onFinish }: { onFinish: () => void }) {
  return (
    <footer className="fixed right-0 bottom-0 left-0 border-t border-border-subtle bg-surface/95 px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xs">
      <div className="mx-auto flex max-w-md flex-col gap-2">
        <Button type="button" onClick={onFinish}>
          Concluir
        </Button>
      </div>
    </footer>
  );
}
