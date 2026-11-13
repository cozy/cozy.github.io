/** A service of the intent: an app page that handles it. */
export interface IntentService {
  slug?: string
  href: string
  [key: string]: unknown
}

/** The intent document of the stack (io.cozy.intents). */
export interface IntentDocument {
  id: string
  _id?: string
  attributes: {
    action: string
    type: string
    permissions?: string[]
    services?: IntentService[]
    client?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

/** The data given to the service at its `ready`. */
export interface IntentData {
  /** Picks the service to frame among the ones of the intent. */
  filteredServices?: (service: IntentService) => boolean
  [key: string]: unknown
}

export interface IntentDimensions {
  width?: number
  height?: number
  maxWidth?: number
  maxHeight?: number
}

export interface StartOptions {
  /** The `load` of the iframe, not the `ready` of the service. */
  onReady?: (event: Event) => void
  /** The service sent `ready` and got its data, once. */
  onServiceReady?: () => void
  /** The service called `notifyReadyToUse()`. */
  onReadyToUse?: () => void
  /** Each result the service hands over while the intent goes on. */
  onResult?: (result: unknown) => void
  onHideCross?: () => void
  onShowCross?: () => void
  /** In place of the styles written on the element. */
  onResize?: (resize: {
    dimensions: IntentDimensions
    transition?: string
  }) => void
  /** Milliseconds the service has to send `ready`. */
  readyTimeout?: number
  /** The `title` of the iframe. */
  title?: string
  /** Classes added to the iframe, next to `coz-intent`. */
  className?: string
  /** Whether the iframe takes the focus when inserted. Defaults to true. */
  focus?: boolean
}

/**
 * Resolves with the document of the service, null when it cancels. Rejects
 * with its error.
 */
export type StartedIntent = Promise<unknown> & {
  stop: () => void
  /** New data for the service: replace the first ones until its `ready`. */
  sendData: (data: object) => void
}

/** The intent being created: `start` frames its service in the element. */
export type CozyIntent = Promise<IntentDocument> & {
  start: (element: HTMLElement, options?: StartOptions) => StartedIntent
}

/** cozy-client's `stackClient.fetchJSON`. */
export type FetchJSON = (
  method: string,
  path: string,
  body?: unknown
) => Promise<unknown>

export interface IntentsOptions {
  client?: { stackClient: { fetchJSON: FetchJSON } }
  fetch?: FetchJSON
}

/** What a service page uses to answer the intent. */
export interface IntentServiceAPI {
  getIntent: () => IntentDocument
  getData: () => unknown
  /** @returns a function that stops listening */
  onData: (listener: (data: unknown) => void) => () => void
  terminate: (document?: unknown) => void
  throw: (error: Error) => void
  cancel: () => void
  compose: (action: string, doctype: string, data?: object) => Promise<unknown>
  resizeClient: (
    dimensions: IntentDimensions & { element?: HTMLElement },
    transition?: string
  ) => void
  hideCross: () => void
  showCross: () => void
  notifyReadyToUse: () => void
  sendResult: (result: unknown) => void
}

export class Intents {
  constructor(options: IntentsOptions)
  create(
    action: string,
    type: string,
    data?: IntentData,
    permissions?: string[]
  ): CozyIntent
  /** Without an intentId, the one in the URL of the page. */
  createService(
    intentId?: string | null,
    serviceWindow?: Window | null,
    options?: { requireFrameAncestors?: boolean }
  ): Promise<IntentServiceAPI>
  getRedirectionURL(type: string, data?: object): Promise<string>
  redirect(
    type: string,
    doc?: object,
    redirectFn?: (url: string) => unknown
  ): Promise<unknown>
}

export default Intents
