declare module 'microee' {
  type Listener = (...args: unknown[]) => void
  type Emitter = IMicroEE

  export interface IMicroEE {
    on(event: string, listener: Listener): Emitter
    once(event: string, listener: Listener): Emitter
    when(event: string, listener: Listener): Emitter
    emit(event: string, ...args: unknown[]): Emitter
    removeListener(event: string, listener: Listener): void
    removeAllListeners(event?: string): void
    listeners(event: string): Listener[]
  }
}
