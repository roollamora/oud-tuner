/**
 * Autocorrelation pitch detector — reliable for plucked string fundamentals.
 */
export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
): number | null {
  const SIZE = buffer.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return null;

  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }
  }

  const buf = buffer.slice(r1, r2);
  const n = buf.length;
  if (n < 2) return null;

  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n - i; j++) {
      sum += buf[j] * buf[j + i];
    }
    c[i] = sum;
  }

  let d = 0;
  while (d < n - 1 && c[d] > c[d + 1]) d++;

  let maxVal = -1;
  let maxPos = -1;
  for (let i = d; i < n; i++) {
    if (c[i] > maxVal) {
      maxVal = c[i];
      maxPos = i;
    }
  }
  if (maxPos <= 0) return null;

  let T0 = maxPos;
  const x1 = c[T0 - 1] ?? c[T0];
  const x2 = c[T0];
  const x3 = c[T0 + 1] ?? c[T0];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  const freq = sampleRate / T0;
  if (freq < 55 || freq > 1200) return null;
  return freq;
}

export class PitchMonitor {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private raf = 0;
  private buffer: Float32Array | null = null;

  async start(onPitch: (hz: number | null) => void): Promise<void> {
    await this.stop();
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    this.ctx = new AudioContext();
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 4096;
    this.source.connect(this.analyser);
    this.buffer = new Float32Array(this.analyser.fftSize);

    const tick = () => {
      if (!this.analyser || !this.buffer || !this.ctx) return;
      this.analyser.getFloatTimeDomainData(
        this.buffer as unknown as Float32Array<ArrayBuffer>,
      );
      const hz = detectPitch(this.buffer, this.ctx.sampleRate);
      onPitch(hz);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  async stop(): Promise<void> {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.source?.disconnect();
    this.analyser?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    if (this.ctx && this.ctx.state !== 'closed') {
      await this.ctx.close();
    }
    this.ctx = null;
    this.stream = null;
    this.analyser = null;
    this.source = null;
    this.buffer = null;
  }
}

let sharedCtx: AudioContext | null = null;

function getToneCtx(): AudioContext {
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new AudioContext();
  }
  return sharedCtx;
}

/** Soft plucked-string-like reference tone. */
export async function playReference(freq: number, duration = 1.4): Promise<void> {
  const ctx = getToneCtx();
  if (ctx.state === 'suspended') await ctx.resume();

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(0.22, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.001, now + duration);
  master.connect(ctx.destination);

  const partials = [
    { mul: 1, gain: 1 },
    { mul: 2, gain: 0.35 },
    { mul: 3, gain: 0.12 },
    { mul: 4, gain: 0.06 },
  ];

  for (const p of partials) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq * p.mul;
    g.gain.value = p.gain;
    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + duration);
  }
}
