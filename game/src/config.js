// Ember & Tide — Duel of Three Winds. Configuration: the three elements,
// the duel's numbers, and the deck's shape. Every number the rules use lives
// here so a balance change is one edit, never a hunt through the code.

export const ELEMENTS = {
  ember: {
    key: 'ember',
    name: 'Ember',
    color: '#e2483d',
    dark: '#8f1f18',
    light: '#ffb3a7',
    beats: 'thorn',
    beatenBy: 'tide',
  },
  tide: {
    key: 'tide',
    name: 'Tide',
    color: '#2b7de9',
    dark: '#144a8f',
    light: '#b3d4ff',
    beats: 'ember',
    beatenBy: 'thorn',
  },
  thorn: {
    key: 'thorn',
    name: 'Thorn',
    color: '#2e9e5b',
    dark: '#14532e',
    light: '#b3e6c6',
    beats: 'tide',
    beatenBy: 'ember',
  },
};

export const ELEMENT_KEYS = ['ember', 'tide', 'thorn'];

// The cycle the player reads on the table: Ember burns Thorn, Thorn drinks
// Tide, Tide drowns Ember.
export const CYCLE_TEXT = 'Ember beats Thorn · Thorn beats Tide · Tide beats Ember';

export const START_LIFE = 30;
export const START_ENERGY = 3;
export const MAX_ENERGY = 5;
export const HAND_START = 5;
export const HAND_MAX = 7;
export const DECK_SIZE = 30;
export const ELEMENT_BONUS = 2;
export const COMBO_BONUS = 2;

// Ten cards per element: a spread of values so every hand has a cheap
// answer and an expensive finisher.
export const VALUES_PER_ELEMENT = [2, 3, 4, 5, 6, 7, 8, 9, 5, 7];

// A card's energy cost grows with its value: small cards are cheap, big
// cards are a commitment.
export function costForValue(value) {
  if (value <= 3) return 1;
  if (value <= 6) return 2;
  return 3;
}

// The element that beats the given one (for the AI's counter-pick and for
// the cycle legend).
export function beatsElement(elementKey) {
  return ELEMENTS[elementKey].beatenBy;
}
