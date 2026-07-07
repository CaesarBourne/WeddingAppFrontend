const names = import.meta.env.VITE_COUPLE_NAMES || 'Amara & Sefu';

const [first = 'Amara', second = 'Sefu'] = names.split(/\s*&\s*/);

export const brand = {
  first,
  second,
  date: import.meta.env.VITE_WEDDING_DATE || 'Igbeyawo, 2025',
  tagline:
    import.meta.env.VITE_TAGLINE ||
    'Every frame from the day, gathered in one place. Add yours.',
};
