import { useEffect } from 'react'

const useRealtime = (client, specs, deps) => {
  useEffect(() => {
    const subscribeRealtime = () => {
      Object.entries(specs).forEach(([doctype, events]) => {
        Object.entries(events).forEach(async ([event, callback]) => {
          try {
            await client.plugins.realtime.subscribe(event, doctype, callback)
          } catch (err) {
            console.error(err)
            console.error(
              `[useRealtime] Impossible to subscribe to ${event} event on ${doctype}. Does your app have the required permissions on this doctype?`
            )
          }
        })
      })
    }

    const unsubscribeRealtime = () => {
      Object.entries(specs).forEach(([doctype, events]) => {
        Object.entries(events).forEach(async ([event, callback]) => {
          try {
            await client.plugins.realtime.unsubscribe(event, doctype, callback)
          } catch (err) {
            console.error(err)
            console.error(
              `[useRealtime] Impossible to unsubscribe from ${event} event on ${doctype}. Does your app have the required permissions on this doctype?`
            )
          }
        })
      })
    }

    if (!client.plugins || !client.plugins.realtime) {
      console.error(
        '[useRealtime] The provided CozyClient instance does not have a RealtimePlugin registered, useRealtime will not work'
      )
      return
    }
    subscribeRealtime()

    return unsubscribeRealtime
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
}

export default useRealtime
