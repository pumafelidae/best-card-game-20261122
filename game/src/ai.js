// Ember & Tide — the Warden, the AI opponent. It chooses one card a turn
// and telegraphs that card's element, so the player can read its intent and
// counter it. The choice is a simple score: a card's value, plus the
// element bonus when it beats the player's last element, plus the combo
// bonus when it repeats the Warden's own last element. Among equal scores
// it takes the cheapest card, so it saves energy for a big turn.

import { ELEMENTS, ELEMENT_BONUS, COMBO_BONUS } from './config.js';

export function scoreCard(card, playerLastElement, aiLastElement) {
  let score = card.value;
  if (playerLastElement && ELEMENTS[card.element].beats === playerLastElement) {
    score += ELEMENT_BONUS;
  }
  if (aiLastElement && card.element === aiLastElement) {
    score += COMBO_BONUS;
  }
  return score;
}

export function chooseCard(ai, playerLastElement) {
  const affordable = ai.hand.filter((card) => card.cost <= ai.energy);
  if (affordable.length === 0) return null;
  let best = affordable[0];
  let bestScore = scoreCard(best, playerLastElement, ai.lastElement);
  for (let i = 1; i < affordable.length; i += 1) {
    const card = affordable[i];
    const score = scoreCard(card, playerLastElement, ai.lastElement);
    if (score > bestScore || (score === bestScore && card.cost < best.cost)) {
      best = card;
      bestScore = score;
    }
  }
  return best;
}

// The Warden commits to its next card at the start of the player's turn and
// shows the card's element face-up as its intent. The value stays hidden.
export function planTurn(ai, playerLastElement) {
  const card = chooseCard(ai, playerLastElement);
  ai.planned = card;
  return card;
}
