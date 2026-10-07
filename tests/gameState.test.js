import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialState, gameReducer } from '../src/game/gameState.js';

// Row 0: "a" is blocked by "b" in front of it. "c" sits alone lower down.
const level = {
  id: 1,
  size: 3,
  arrows: [
    { id: 'a', row: 0, col: 0, direction: 'right' },
    { id: 'b', row: 0, col: 1, direction: 'right' },
    { id: 'c', row: 2, col: 2, direction: 'down' },
  ],
};

const run = (actions, state = createInitialState(level)) => actions.reduce(gameReducer, state);
const tap = (arrowId) => ({ type: 'tap', arrowId });
const finishEscape = (state) => gameReducer(state, { type: 'escapeDone', seq: state.escaping.seq });

describe('game state', () => {
  it('starts an escape for a free arrow and removes it when the animation ends', () => {
    const escaping = run([tap('b')]);
    assert.equal(escaping.escaping.id, 'b');
    assert.equal(escaping.arrows.length, 3, 'arrow stays rendered while it animates out');
    assert.equal(escaping.moves, 1);

    const settled = finishEscape(escaping);
    assert.equal(settled.escaping, null);
    assert.deepEqual(settled.arrows.map((a) => a.id), ['a', 'c']);
  });

  it('counts a bump as a move without changing the board', () => {
    const state = run([tap('a')]);
    assert.equal(state.moves, 1);
    assert.equal(state.arrows.length, 3);
    assert.deepEqual([state.bump.arrowId, state.bump.blockerId], ['a', 'b']);
    assert.equal(state.penaltySeq, state.bump.seq);
    assert.equal(state.escaping, null);
  });

  it('ignores repeat taps on an arrow that is already leaving', () => {
    const state = run([tap('b'), tap('b'), tap('b')]);
    assert.equal(state.moves, 1);
    assert.equal(state.queuedTap, null);
  });

  it('queues one tap during an escape and plays it afterwards', () => {
    const state = run([tap('b'), tap('a')]);
    assert.equal(state.moves, 1, 'queued tap is not counted yet');
    const next = finishEscape(state);
    assert.equal(next.escaping.id, 'a', 'freed arrow escapes rather than bumping');
    assert.equal(next.moves, 2);
  });

  it('ignores stale animation callbacks', () => {
    const state = run([tap('b')]);
    assert.equal(gameReducer(state, { type: 'escapeDone', seq: state.escaping.seq + 99 }), state);
  });

  it('completes only after the last arrow has finished leaving', () => {
    let state = createInitialState(level);
    for (const id of ['b', 'a', 'c']) {
      state = gameReducer(state, tap(id));
      assert.equal(state.status, 'playing');
      state = finishEscape(state);
    }
    assert.equal(state.status, 'complete');
    assert.equal(state.moves, 3);
    assert.equal(gameReducer(state, tap('a')), state, 'taps are ignored once complete');
  });

  it('undo restores the board and takes back the move, but keeps bumps counted', () => {
    const before = run([tap('a')]); // bump: 1 move
    const after = run([tap('c')], before);
    const settled = finishEscape(after);
    const undone = gameReducer(settled, { type: 'undo' });
    assert.equal(undone.arrows.length, 3);
    assert.equal(undone.moves, 1);
    assert.equal(undone.history.length, 0);
  });

  it('refuses undo while an arrow is moving or with no history', () => {
    const fresh = createInitialState(level);
    assert.equal(gameReducer(fresh, { type: 'undo' }), fresh);
    const moving = run([tap('b')]);
    assert.equal(gameReducer(moving, { type: 'undo' }), moving);
  });

  it('restart mid-animation resets everything', () => {
    const state = run([tap('a'), tap('b'), tap('c'), { type: 'restart' }]);
    assert.equal(state.moves, 0);
    assert.equal(state.escaping, null);
    assert.equal(state.queuedTap, null);
    assert.equal(state.arrows.length, 3);
    assert.equal(state.history.length, 0);
    assert.equal(state.penaltySeq, 0);
  });

  it('hint points at a free arrow, costs one move, and repeats for free', () => {
    const hinted = run([{ type: 'hint' }]);
    assert.ok(['b', 'c'].includes(hinted.hint.arrowId));
    assert.equal(hinted.moves, 1);
    const again = gameReducer(hinted, { type: 'hint' });
    assert.equal(again.moves, 1);
    assert.notEqual(again.hint.seq, hinted.hint.seq, 'glow replays');
    const cleared = gameReducer(again, tap('c'));
    assert.equal(cleared.hint, null, 'hint disappears after the player acts');
  });
});
