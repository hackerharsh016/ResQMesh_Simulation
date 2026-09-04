import { SimulationEvent } from '../../types';

export class SimulationEngine {
  private currentTime: number = 0;
  private eventQueue: SimulationEvent[] = [];
  private isPlaying: boolean = false;
  private playbackSpeed: number = 1;
  private lastTickTime: number = 0;
  private rafId: number | null = null;
  private subscribers: Set<(event: SimulationEvent) => void> = new Set();

  constructor() {}

  public scheduleEvent(event: SimulationEvent) {
    this.eventQueue.push(event);
    this.eventQueue.sort((a, b) => a.timestamp - b.timestamp);
  }

  public subscribe(callback: (event: SimulationEvent) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private processEvents() {
    while (this.eventQueue.length > 0 && this.eventQueue[0].timestamp <= this.currentTime) {
      const event = this.eventQueue.shift()!;
      for (const sub of this.subscribers) {
        sub(event);
      }
    }
  }

  private tick = (timestamp: number) => {
    if (!this.isPlaying) return;

    if (this.lastTickTime === 0) {
      this.lastTickTime = timestamp;
    }

    const delta = (timestamp - this.lastTickTime) * this.playbackSpeed;
    this.currentTime += delta;
    this.lastTickTime = timestamp;

    this.processEvents();

    this.rafId = requestAnimationFrame(this.tick);
  };

  public play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.lastTickTime = performance.now();
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  public pause() {
    this.isPlaying = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public setSpeed(speed: number) {
    this.playbackSpeed = speed;
  }

  public reset() {
    this.pause();
    this.currentTime = 0;
    this.eventQueue = [];
    this.lastTickTime = 0;
  }

  public getCurrentTime() {
    return this.currentTime;
  }
}
