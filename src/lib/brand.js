// Branding pulled from env so the album can be reskinned without code edits.
// e.g. VITE_COUPLE_NAMES="Amara & Sefu"  VITE_WEDDING_DATE="14 June 2025"
const names = import.meta.env.VITE_COUPLE_NAMES || 'Amara & Sefu';

const [first = 'Amara', second = 'Sefu'] = names.split(/\s*&\s*/);

export const brand = {
  first,
  second,
  date: import.meta.env.VITE_WEDDING_DATE || 'Midsummer, 2025',
  tagline:
    import.meta.env.VITE_TAGLINE ||
    'Every frame from the day, gathered in one place. Add yours.',
};
