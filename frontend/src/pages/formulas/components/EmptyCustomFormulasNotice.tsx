export function EmptyCustomFormulasNotice() {
  return (
    <div className="flex flex-col items-center justify-center text-center mt-8 px-4 select-none">
      <p className="text-base font-bold text-brand-900">
        Você ainda não possui fórmulas personalizadas.
      </p>
      <p className="text-sm text-placeholder mt-1">
        Clique em &quot;Criar nova fórmula&quot; para começar.
      </p>
    </div>
  );
}
