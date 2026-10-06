export const CARD_CLASS =
  'flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_1px_2px_rgb(16_33_76/0.06)]';

export const INTERACTIVE_CARD_CLASS = `${CARD_CLASS} group transition-[translate,scale,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-14px_rgb(0_0_119/0.35)] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-900`;

export const CARD_ACCENT_CLASS =
  'h-1 w-full bg-brand-900 transition-[height] duration-200 group-hover:h-1.5';

export const PAGE_CONTAINER_CLASS = 'mx-auto w-full max-w-md px-4 sm:max-w-2xl lg:max-w-5xl';

export const CARD_GRID_CLASS = 'stagger-in grid gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0';
