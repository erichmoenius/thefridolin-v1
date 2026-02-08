export function startLoop(callback) {
  function loop(time) {
    callback({ time: time * 0.001 });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
