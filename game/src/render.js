// Ember & Tide — rendering. Every pixel the player sees is built here from
// the game state: the title screen, the table with both hands, the clash
// zone, the life bars, the energy pips, the log, and the win and loss
// screens. Cards are DOM nodes so they stay crisp and legible at thumbnail
// size; each element is told apart by colour AND by its shape, never by
// text alone.

import { ELEMENTS, CYCLE_TEXT, MAX_ENERGY } from './config.js';

// One inline SVG per element, drawn in the element's colour. A flame for
// Ember, a wave for Tide, a leaf for Thorn.
const ICONS = {
  ember: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c.8 3.2-2.4 4.6-2.4 7.4 0 1.1.6 2 1.6 2 .9 0 1.6-.7 1.6-1.6 2.2 1.6 3.4 3.8 3.4 6.4a5.2 5.2 0 0 1-10.4 0C5.8 11.4 9 7.4 12 2z"/></svg>',
  tide: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 15c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0 3.5-2 5-1v6H2v-5zm0-6c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0 3.5-2 5-1v5H2V9z"/></svg>',
  thorn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.5 7.5 4 13 12 22c8-9 5.5-14.5 0-20zm0 4.5c2.6 3 3.4 7.3.6 11.6-2.8-4.3-2-8.6-.6-11.6z"/></svg>',
};

export function elementIcon(key) {
  return ICONS[key] || '';
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function pips(count, max, className) {
  const wrap = el('span', className);
  for (let i = 0; i < max; i += 1) {
    wrap.appendChild(el('span', 'pip' + (i < count ? ' on' : '')));
  }
  return wrap;
}

// One card, face up: a big value, the element's shape in its colour, the
// element's name, and cost pips along the bottom edge.
export function cardElement(card, options) {
  const opts = options || {};
  const element = ELEMENTS[card.element];
  const node = el('div', 'card element-' + card.element);
  if (opts.faceDown) {
    node.classList.add('back');
    node.appendChild(el('div', 'card-back-mark', '✦'));
    return node;
  }
  const icon = el('div', 'card-icon');
  icon.innerHTML = elementIcon(card.element);
  node.appendChild(icon);
  node.appendChild(el('div', 'card-value', String(card.value)));
  node.appendChild(el('div', 'card-name', element.name));
  const cost = el('div', 'card-cost');
  for (let i = 0; i < card.cost; i += 1) cost.appendChild(el('span', 'pip on'));
  node.appendChild(cost);
  if (opts.playable === false) node.classList.add('unplayable');
  if (opts.selected) node.classList.add('selected');
  if (card.id !== undefined) node.dataset.cardId = String(card.id);
  return node;
}

function lifeBar(life, max) {
  const shown = Math.max(0, life);
  const wrap = el('div', 'lifebar');
  const fill = el('div', 'lifebar-fill');
  fill.style.width = Math.max(0, Math.min(100, (shown / max) * 100)) + '%';
  if (shown <= 10) fill.classList.add('low');
  wrap.appendChild(fill);
  wrap.appendChild(el('span', 'lifebar-text', shown + ' / ' + max));
  return wrap;
}

export function renderAll(state) {
  renderOpponent(state);
  renderClash(state);
  renderPlayer(state);
  renderLog(state);
  const title = document.getElementById('title-screen');
  const table = document.getElementById('table');
  const end = document.getElementById('end-screen');
  if (state.screen === 'title') {
    title.classList.remove('hidden');
    table.classList.add('hidden');
    end.classList.add('hidden');
  } else if (state.screen === 'end') {
    title.classList.add('hidden');
    table.classList.remove('hidden');
    end.classList.remove('hidden');
    renderEnd(state);
  } else {
    title.classList.add('hidden');
    table.classList.remove('hidden');
    end.classList.add('hidden');
  }
}

function renderOpponent(state) {
  const ai = state.ai;
  document.getElementById('ai-life').replaceChildren(lifeBar(ai.life, state.maxLife));
  document.getElementById('ai-energy').replaceChildren(pips(ai.energy, MAX_ENERGY, 'energy-pips'));
  const intent = document.getElementById('ai-intent');
  intent.replaceChildren();
  if (ai.planned) {
    const element = ELEMENTS[ai.planned.element];
    intent.appendChild(el('span', 'intent-label', 'Next:'));
    const icon = el('span', 'intent-icon element-' + ai.planned.element);
    icon.innerHTML = elementIcon(ai.planned.element);
    intent.appendChild(icon);
    intent.appendChild(el('span', 'intent-name', element.name));
  } else {
    intent.appendChild(el('span', 'intent-label', 'The Warden is thinking…'));
  }
  const hand = document.getElementById('ai-hand');
  hand.replaceChildren();
  for (let i = 0; i < ai.hand.length; i += 1) {
    hand.appendChild(cardElement({ element: 'ember', value: 0, cost: 0 }, { faceDown: true }));
  }
  document.getElementById('ai-count').textContent = ai.hand.length + ' cards';
}

function renderClash(state) {
  const zone = document.getElementById('clash-zone');
  const clash = state.clash;
  const playerSlot = document.getElementById('clash-player');
  const aiSlot = document.getElementById('clash-ai');
  playerSlot.replaceChildren();
  aiSlot.replaceChildren();
  if (clash) {
    if (clash.playerCard) {
      playerSlot.appendChild(cardElement(clash.playerCard, {}));
    } else {
      playerSlot.appendChild(el('div', 'clash-empty', 'You pass'));
    }
    if (clash.aiCard) {
      aiSlot.appendChild(cardElement(clash.aiCard, {}));
    } else {
      aiSlot.appendChild(el('div', 'clash-empty', 'Warden passes'));
    }
    zone.querySelector('.clash-result').textContent = clash.text;
  } else {
    playerSlot.appendChild(el('div', 'clash-empty', 'Your card'));
    aiSlot.appendChild(el('div', 'clash-empty', 'Warden’s card'));
    zone.querySelector('.clash-result').textContent = 'Play a card to clash.';
  }
  document.getElementById('cycle-legend').textContent = CYCLE_TEXT;
  document.getElementById('turn-label').textContent = 'Turn ' + state.turn;
}

function renderPlayer(state) {
  const player = state.player;
  document.getElementById('player-life').replaceChildren(lifeBar(player.life, state.maxLife));
  document.getElementById('player-energy').replaceChildren(pips(player.energy, MAX_ENERGY, 'energy-pips'));
  const hand = document.getElementById('player-hand');
  hand.replaceChildren();
  for (const card of player.hand) {
    const playable = state.phase === 'player' && card.cost <= player.energy;
    const node = cardElement(card, { playable });
    if (playable) node.classList.add('clickable');
    hand.appendChild(node);
  }
  const pass = document.getElementById('pass-button');
  pass.disabled = state.phase !== 'player';
}

function renderLog(state) {
  const log = document.getElementById('battle-log');
  log.replaceChildren();
  const entries = state.log.slice(-5);
  for (const entry of entries) {
    const line = el('div', 'log-line', entry);
    log.appendChild(line);
  }
}

function renderEnd(state) {
  const end = document.getElementById('end-screen');
  const won = state.winner === 'player';
  end.querySelector('.end-title').textContent = won ? 'VICTORY' : 'DEFEAT';
  end.querySelector('.end-subtitle').textContent = won
    ? 'The winds bow to you. The Warden yields the table.'
    : 'The Warden keeps the winds. Shuffle up and try again.';
  const stats = end.querySelector('.end-stats');
  stats.replaceChildren();
  stats.appendChild(el('div', 'end-stat', 'Turns: ' + state.stats.turns));
  stats.appendChild(el('div', 'end-stat', 'Damage dealt: ' + state.stats.damageDealt));
  stats.appendChild(el('div', 'end-stat', 'Damage taken: ' + state.stats.damageTaken));
  end.classList.toggle('won', won);
  end.classList.toggle('lost', !won);
}
