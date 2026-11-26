export const CARD_CLASS =
  'flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-elevated shadow-[0_1px_2px_rgb(0_0_0/0.06)]';

export const INTERACTIVE_CARD_CLASS = `${CARD_CLASS} group transition-[translate,scale,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-14px_var(--color-brand-shadow)] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent`;

export const CARD_ACCENT_CLASS =
  'h-1 w-full bg-brand-stripe transition-[height] duration-200 group-hover:h-1.5';

export const PAGE_CONTAINER_CLASS = 'mx-auto w-full max-w-md px-4 sm:max-w-2xl lg:max-w-5xl';

// Fixed bar sharing the page container; the negative margin centers the 56px FAB under the
// 36px header avatar.
export const FAB_CONTAINER_CLASS = `${PAGE_CONTAINER_CLASS} pointer-events-none fixed inset-x-0 bottom-6 flex flex-col items-end gap-3 [&>*]:pointer-events-auto [&>*]:-mr-2.5`;

// Mirror of FAB_CONTAINER_CLASS for a button anchored to the left edge of the page.
export const FAB_LEFT_CONTAINER_CLASS = `${PAGE_CONTAINER_CLASS} pointer-events-none fixed inset-x-0 bottom-6 flex flex-col items-start gap-3 [&>*]:pointer-events-auto [&>*]:-ml-2.5`;

export const CARD_GRID_CLASS = 'stagger-in grid gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0';
