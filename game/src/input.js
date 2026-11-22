// Ember & Tide — input. Mouse and keyboard, both: click a card to play it,
// click Pass to bank energy, Enter to start, R to play again after the end
// screen, M to toggle sound. Clicks on cards the player cannot afford are
// ignored, and every handler checks the phase first so a double click can
// never play two cards at once.

export function bindInput(handlers) {
  const hand = document.getElementById('player-hand');
  hand.addEventListener('click', (event) => {
    const cardNode = event.target.closest('.card');
    if (!cardNode || !cardNode.dataset.cardId) return;
    handlers.playCard(Number(cardNode.dataset.cardId));
  });

  document.getElementById('pass-button').addEventListener('click', () => {
    handlers.passTurn();
  });

  document.getElementById('play-button').addEventListener('click', () => {
    handlers.startGame();
  });

  document.getElementById('again-button').addEventListener('click', () => {
    handlers.startGame();
  });

  document.getElementById('sound-button').addEventListener('click', (event) => {
    const on = handlers.toggleSound();
    event.currentTarget.textContent = on ? 'Sound: on' : 'Sound: off';
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const title = document.getElementById('title-screen');
      const end = document.getElementById('end-screen');
      if (!title.classList.contains('hidden')) handlers.startGame();
      else if (!end.classList.contains('hidden')) handlers.startGame();
    }
    if (event.key === 'r' || event.key === 'R') {
      const end = document.getElementById('end-screen');
      if (!end.classList.contains('hidden')) handlers.startGame();
    }
    if (event.key === 'm' || event.key === 'M') {
      const on = handlers.toggleSound();
      document.getElementById('sound-button').textContent = on ? 'Sound: on' : 'Sound: off';
    }
    if (event.key === 'p' || event.key === 'P') {
      handlers.passTurn();
    }
  });
}
