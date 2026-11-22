// Ember & Tide — the game itself. The state machine and the turn flow.
// A duel is a series of clashes: the player picks one card, the Warden has
// already committed to one (its element telegraphed), both reveal, and the
// higher total wins the clash — value, plus 2 when the element beats the
// other, plus 2 when it repeats the side's last element. The loser takes
// the difference as damage. Energy regenerates one a turn, capped at five,
// and a pass banks energy but eats the Warden's card unopposed.

import {
  START_LIFE,
  START_ENERGY,
  MAX_ENERGY,
  HAND_START,
  HAND_MAX,
  ELEMENTS,
  ELEMENT_BONUS,
  COMBO_BONUS,
} from './config.js';
import { buildDeck, drawCard, drawOpeningHand, makeCard } from './deck.js';
import { planTurn } from './ai.js';
import { renderAll } from './render.js';
import { bindInput } from './input.js';
import {
  setSoundEnabled,
  isSoundEnabled,
  playCardSound,
  damageSound,
  winSound,
  loseSound,
} from './audio.js';

let state = null;

function newSide() {
  return {
    life: START_LIFE,
    energy: START_ENERGY,
    hand: [],
    deck: buildDeck(),
    discard: [],
    lastElement: null,
    planned: null,
  };
}

function newGame() {
  const game = {
    screen: 'table',
    turn: 1,
    phase: 'player',
    maxLife: START_LIFE,
    player: newSide(),
    ai: newSide(),
    clash: null,
    log: [],
    winner: null,
    stats: { turns: 0, damageDealt: 0, damageTaken: 0 },
  };
  drawOpeningHand(game.player, HAND_START);
  drawOpeningHand(game.ai, HAND_START);
  planTurn(game.ai, null);
  game.log.push('The duel begins. The Warden shows its intent — counter it.');
  return game;
}

function totalFor(card, opponentElement, lastElement) {
  let total = card.value;
  const bonuses = [];
  if (ELEMENTS[card.element].beats === opponentElement) {
    total += ELEMENT_BONUS;
    bonuses.push('element +' + ELEMENT_BONUS);
  }
  if (lastElement && card.element === lastElement) {
    total += COMBO_BONUS;
    bonuses.push('combo +' + COMBO_BONUS);
  }
  return { total, bonuses };
}

function resolveClash(playerCard, aiCard) {
  const player = totalFor(playerCard, aiCard.element, state.player.lastElement);
  const ai = totalFor(aiCard, playerCard.element, state.ai.lastElement);
  let text = '';
  let damage = 0;
  let damageTo = null;
  if (player.total > ai.total) {
    damage = player.total - ai.total;
    damageTo = 'ai';
    text = 'You win the clash ' + player.total + '–' + ai.total + ' and deal ' + damage + ' damage.';
  } else if (ai.total > player.total) {
    damage = ai.total - player.total;
    damageTo = 'player';
    text = 'The Warden wins the clash ' + ai.total + '–' + player.total + ' and deals ' + damage + ' damage.';
  } else {
    text = 'Even clash ' + player.total + '–' + ai.total + ' — sparks, no damage.';
  }
  if (player.bonuses.length > 0 || ai.bonuses.length > 0) {
    const notes = [];
    if (player.bonuses.length > 0) notes.push('yours ' + player.bonuses.join(', '));
    if (ai.bonuses.length > 0) notes.push('Warden’s ' + ai.bonuses.join(', '));
    text += ' (' + notes.join('; ') + ')';
  }
  return { playerCard, aiCard, playerTotal: player.total, aiTotal: ai.total, damage, damageTo, text };
}

function removeFromHand(side, cardId) {
  const index = side.hand.findIndex((card) => card.id === cardId);
  if (index === -1) return null;
  const removed = side.hand.splice(index, 1)[0];
  return removed;
}

function endTurn() {
  const player = state.player;
  const ai = state.ai;
  if (player.hand.length < HAND_MAX) drawCard(player);
  if (ai.hand.length < HAND_MAX) drawCard(ai);
  player.energy = Math.min(MAX_ENERGY, player.energy + 1);
  ai.energy = Math.min(MAX_ENERGY, ai.energy + 1);
  state.turn += 1;
  planTurn(ai, player.lastElement);
  state.phase = 'player';
}

function checkEnd() {
  if (state.ai.life <= 0) {
    state.winner = 'player';
    state.screen = 'end';
    winSound();
    state.log.push('Victory — the Warden yields the table.');
    return true;
  }
  if (state.player.life <= 0) {
    state.winner = 'ai';
    state.screen = 'end';
    loseSound();
    state.log.push('Defeat — the Warden keeps the winds.');
    return true;
  }
  return false;
}

function playCard(cardId) {
  if (!state || state.phase !== 'player' || state.screen !== 'table') return;
  const card = state.player.hand.find((c) => c.id === cardId);
  if (!card || card.cost > state.player.energy) return;
  state.player.energy -= card.cost;
  removeFromHand(state.player, cardId);
  playCardSound();
  const aiCard = state.ai.planned;
  state.player.lastElement = card.element;
  if (!aiCard) {
    state.ai.life -= card.value;
    state.stats.damageDealt += card.value;
    state.stats.turns += 1;
    state.clash = {
      playerCard: card,
      aiCard: null,
      playerTotal: card.value,
      aiTotal: 0,
      damage: card.value,
      damageTo: 'ai',
      text: 'The Warden passes — your ' + ELEMENTS[card.element].name + ' ' + card.value + ' strikes unopposed.',
    };
    state.log.push(state.clash.text);
    state.player.discard.push(card);
    damageSound();
    if (!checkEnd()) endTurn();
    renderAll(state);
    return;
  }
  removeFromHand(state.ai, aiCard.id);
  state.ai.energy = Math.max(0, state.ai.energy - aiCard.cost);
  state.ai.lastElement = aiCard.element;
  state.ai.planned = null;
  const clash = resolveClash(card, aiCard);
  state.clash = clash;
  state.stats.turns += 1;
  if (clash.damageTo === 'ai') {
    state.ai.life -= clash.damage;
    state.stats.damageDealt += clash.damage;
    damageSound();
  } else if (clash.damageTo === 'player') {
    state.player.life -= clash.damage;
    state.stats.damageTaken += clash.damage;
    damageSound();
  }
  state.player.discard.push(card);
  state.ai.discard.push(aiCard);
  state.log.push(clash.text);
  if (!checkEnd()) endTurn();
  renderAll(state);
}

function passTurn() {
  if (!state || state.phase !== 'player' || state.screen !== 'table') return;
  const aiCard = state.ai.planned;
  state.player.energy = Math.min(MAX_ENERGY, state.player.energy + 1);
  if (state.player.hand.length < HAND_MAX) drawCard(state.player);
  if (aiCard) {
    removeFromHand(state.ai, aiCard.id);
    state.ai.energy = Math.max(0, state.ai.energy - aiCard.cost);
    state.ai.lastElement = aiCard.element;
    state.ai.planned = null;
    state.player.life -= aiCard.value;
    state.stats.damageTaken += aiCard.value;
    state.stats.turns += 1;
    state.clash = {
      playerCard: null,
      aiCard,
      playerTotal: 0,
      aiTotal: aiCard.value,
      damage: aiCard.value,
      damageTo: 'player',
      text: 'You pass and bank energy — the Warden’s ' + ELEMENTS[aiCard.element].name + ' ' + aiCard.value + ' hits you for ' + aiCard.value + '.',
    };
    state.log.push(state.clash.text);
    state.ai.discard.push(aiCard);
    damageSound();
    if (!checkEnd()) endTurn();
  } else {
    state.log.push('You pass and bank energy. The Warden holds its cards.');
    endTurn();
  }
  renderAll(state);
}

function startGame() {
  state = newGame();
  renderAll(state);
}

// Demo hooks for screenshots: ?screen=table plays three real clashes to a
// mid-game state; ?screen=win and ?screen=loss drive a real final clash to
// the end screen. Every state they show comes from the same playCard path
// a player uses.
// Pick the player's best affordable card against the Warden's telegraphed
// element: the highest clash total, so the demo plays the counter the game
// teaches instead of the biggest number.
function bestCardForClash() {
  const aiElement = state.ai.planned ? state.ai.planned.element : null;
  let best = null;
  let bestTotal = -1;
  for (const card of state.player.hand) {
    if (card.cost > state.player.energy) continue;
    const total = totalFor(card, aiElement, state.player.lastElement).total;
    if (total > bestTotal) {
      bestTotal = total;
      best = card;
    }
  }
  return best;
}

// One demo action: play the best affordable card, or pass to bank energy
// when nothing is affordable (real play — a pass banks energy and eats the
// Warden's card, so the demo never stalls on an empty energy bar).
function demoAction() {
  const card = bestCardForClash();
  if (card) playCard(card.id);
  else passTurn();
}

function demoTable() {
  startGame();
  for (let i = 0; i < 3; i += 1) {
    demoAction();
    if (state.screen !== 'table') break;
  }
}

function demoEnd(won) {
  startGame();
  for (let i = 0; i < 2; i += 1) {
    demoAction();
    if (state.screen !== 'table') return;
  }
  if (won) {
    state.ai.life = 3;
    state.player.life = 24;
    const finisher = makeCard('ember', 9);
    state.player.hand.push(finisher);
    state.player.energy = 5;
    const weak = makeCard('thorn', 2);
    state.ai.hand.push(weak);
    state.ai.energy = 5;
    state.ai.planned = weak;
    playCard(finisher.id);
  } else {
    state.player.life = 3;
    state.ai.life = 22;
    const weak = makeCard('thorn', 2);
    state.player.hand.push(weak);
    state.player.energy = 5;
    const finisher = makeCard('tide', 9);
    state.ai.hand.push(finisher);
    state.ai.energy = 5;
    state.ai.planned = finisher;
    playCard(weak.id);
  }
}

function boot() {
  const params = new URLSearchParams(window.location.search);
  const screen = params.get('screen');
  bindInput({
    playCard,
    passTurn,
    startGame,
    toggleSound: () => {
      setSoundEnabled(!isSoundEnabled());
      return isSoundEnabled();
    },
  });
  if (screen === 'table') {
    demoTable();
  } else if (screen === 'win') {
    demoEnd(true);
  } else if (screen === 'loss') {
    demoEnd(false);
  } else {
    state = {
      screen: 'title',
      turn: 1,
      phase: 'player',
      maxLife: START_LIFE,
      player: newSide(),
      ai: newSide(),
      clash: null,
      log: [],
      winner: null,
      stats: { turns: 0, damageDealt: 0, damageTaken: 0 },
    };
    renderAll(state);
  }
}

boot();
