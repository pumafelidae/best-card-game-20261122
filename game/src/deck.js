// Ember & Tide — the deck. Builds the 30-card deck, shuffles it, draws
// from it, and reshuffles the discard pile when the deck runs dry. A card
// is a plain object: { id, element, value, cost }.

import { ELEMENT_KEYS, VALUES_PER_ELEMENT, costForValue } from './config.js';

let nextId = 1;

export function makeCard(element, value) {
  return {
    id: nextId,
    element,
    value,
    cost: costForValue(value),
  };
}

export function buildDeck() {
  const deck = [];
  for (const element of ELEMENT_KEYS) {
    for (const value of VALUES_PER_ELEMENT) {
      deck.push(makeCard(element, value));
      nextId += 1;
    }
  }
  return shuffle(deck);
}

// Fisher-Yates, in place, returning the same array for chaining.
export function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const held = deck[i];
    deck[i] = deck[j];
    deck[j] = held;
  }
  return deck;
}

// Draw one card into a hand. When the deck is empty the discard pile is
// shuffled back in; when both are empty there is nothing to draw.
export function drawCard(side) {
  if (side.deck.length === 0) {
    if (side.discard.length === 0) return null;
    side.deck = shuffle(side.discard);
    side.discard = [];
  }
  const card = side.deck.pop();
  if (card) side.hand.push(card);
  return card;
}

export function drawOpeningHand(side, count) {
  for (let i = 0; i < count; i += 1) drawCard(side);
}
