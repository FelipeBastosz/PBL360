import { Button } from '@/components/ui/Button';

export function LeaveRoomsFooter({ onFinish }: { onFinish: () => void }) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-surface/95 px-6 py-4 backdrop-blur-xs">
      <div className="mx-auto flex max-w-md flex-col gap-2">
        <Button type="button" onClick={onFinish}>
          Concluir
        </Button>
      </div>
    </footer>
  );
}
