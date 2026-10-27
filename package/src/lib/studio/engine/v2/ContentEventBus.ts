/**
 * ContentEventBus — In-process event bus for streaming pipeline events.
 * 
 * Each job gets its own EventEmitter. SSE handlers subscribe to job events
 * and forward them to the browser as Server-Sent Events.
 * 
 * Events are also persisted on the ContentPackage for replay on refresh.
 */
import { EventEmitter } from 'events';
import { ContentExecutionEvent } from './models/ContentExecutionEvent';

const busMap = new Map<string, EventEmitter>();

export class ContentEventBus {
  static getOrCreate(jobId: string): EventEmitter {
    if (!busMap.has(jobId)) {
      const emitter = new EventEmitter();
      emitter.setMaxListeners(20);
      busMap.set(jobId, emitter);
    }
    return busMap.get(jobId)!;
  }

  static emit(jobId: string, event: ContentExecutionEvent): void {
    const bus = ContentEventBus.getOrCreate(jobId);
    bus.emit('event', event);
  }

  static subscribe(jobId: string, handler: (event: ContentExecutionEvent) => void): () => void {
    const bus = ContentEventBus.getOrCreate(jobId);
    bus.on('event', handler);
    return () => bus.off('event', handler);
  }

  static complete(jobId: string): void {
    const bus = ContentEventBus.getOrCreate(jobId);
    bus.emit('complete');
    // Allow a brief delay then clean up
    setTimeout(() => busMap.delete(jobId), 60_000);
  }

  static destroy(jobId: string): void {
    busMap.get(jobId)?.removeAllListeners();
    busMap.delete(jobId);
  }
}
