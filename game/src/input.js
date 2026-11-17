export function createInput(canvas) {
  const keys = new Set();
  const state = { x: 640, y: 360, pointer: false, fire: false, dash: false, pause: false, confirm: false, audio: false, choice: 0 };
  window.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    if (!keys.has(key)) {
      if (key === 'escape' || key === 'p') state.pause = true;
      if (key === 'enter' || key === ' ') state.confirm = true;
      if (key === 'm') state.audio = true;
      if (['1', '2', '3'].includes(key)) state.choice = Number(key);
    }
    keys.add(key);
  });
  window.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
  const locate = event => {
    const bounds = canvas.getBoundingClientRect();
    state.x = (event.clientX - bounds.left) * (canvas.width / bounds.width);
    state.y = (event.clientY - bounds.top) * (canvas.height / bounds.height);
    state.pointer = true;
  };
  canvas.addEventListener('pointermove', locate);
  canvas.addEventListener('pointerdown', event => { locate(event); state.fire = true; state.confirm = true; });
  window.addEventListener('pointerup', () => { state.fire = false; });
  return {
    state,
    movement() { return { x: Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft')), y: Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup')) }; },
    get firing() { return state.fire || keys.has(' ') || keys.has('enter'); },
    get dashing() { return keys.has('shift') || keys.has('x'); },
  };
}
