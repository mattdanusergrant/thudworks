// THUDWORKS — step sequencer transport. Uses the lookahead-scheduler pattern:
// a setInterval wakes often and schedules upcoming steps slightly ahead on the
// audio clock, so timing stays sample-tight regardless of UI jank.

export class Sequencer {
  constructor(ctx, onTrigger) {
    this.ctx = ctx;
    this.onTrigger = onTrigger;     // (stepIndex, time) => play that column's voices
    this.bpm = 90;
    this.swing = 0;                 // 0..70 (%) — delays every other 16th
    this.steps = 16;
    this.current = 0;
    this.nextTime = 0;
    this.playing = false;
    this.lookaheadMs = 25;
    this.scheduleAhead = 0.12;      // seconds
    this.timer = null;
    this.queue = [];                // {step, time} for the visual playhead
  }

  get sixteenth() { return (60 / this.bpm) / 4; }

  start() {
    if (this.playing) return;
    this.playing = true;
    this.current = 0;
    this.nextTime = this.ctx.currentTime + 0.06;
    this.timer = setInterval(() => this._schedule(), this.lookaheadMs);
  }

  stop() {
    this.playing = false;
    clearInterval(this.timer);
    this.queue.length = 0;
  }

  _schedule() {
    while (this.nextTime < this.ctx.currentTime + this.scheduleAhead) {
      // swing: push odd (off-beat) 16ths later
      const swingSec = this.sixteenth * (this.swing / 100);
      const playTime = this.nextTime + (this.current % 2 ? swingSec : 0);
      this.onTrigger(this.current, playTime);
      this.queue.push({ step: this.current, time: playTime });
      this.nextTime += this.sixteenth;
      this.current = (this.current + 1) % this.steps;
    }
  }
}
