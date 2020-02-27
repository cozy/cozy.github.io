import SubscriptionList from './SubscriptionList'
import {
  allowDoubleSubscriptions,
  requireDoubleUnsubscriptions
} from './config'
import logger from './logger'

logger.minilog.disable()

const subscriptions = {
  created: {
    event: 'CREATED',
    type: 'io.cozy.files',
    id: null,
    handler: jest.fn()
  },
  updated: {
    event: 'UPDATED',
    type: 'io.cozy.files',
    id: null,
    handler: jest.fn()
  },
  updated33: {
    event: 'UPDATED',
    type: 'io.cozy.files',
    id: '33',
    handler: jest.fn()
  },
  updatedAlbum: {
    event: 'UPDATED',
    type: 'io.cozy.photos.albums',
    id: '33',
    handler: jest.fn()
  },
  deleted: {
    event: 'DELETED',
    type: 'io.cozy.files',
    id: null,
    handler: jest.fn()
  },
  deleted33: {
    event: 'DELETED',
    type: 'io.cozy.files',
    id: null,
    handler: jest.fn()
  }
}

describe('SubscriptionList', () => {
  describe('add', () => {
    it('adds simple subscriptions', () => {
      const list = new SubscriptionList()
      const empty = list.getAll()
      expect(empty).toHaveLength(0)
      const subscription = subscriptions.created
      list.add(subscription)
      const all = list.getAll()
      expect(all).toHaveLength(1)
      expect(all).toEqual([subscription])
    })

    it('adds multiple subscriptions', () => {
      const list = new SubscriptionList()
      const requested = Object.values(subscriptions)
      for (const item of requested) {
        list.add(item)
      }
      const all = list.getAll()
      expect(all).toHaveLength(requested.length)
      expect(all.sort()).toEqual(requested.sort())
    })

    if (allowDoubleSubscriptions) {
      it('adds two times the subscription', () => {
        const list = new SubscriptionList()
        const subscription = subscriptions.created
        list.add(subscription)
        list.add(subscription)
        const all = list.getAll()
        expect(all).toHaveLength(2)
        expect(all).toEqual([subscription, subscription])
      })
    } else {
      it('does not add a second subscription', () => {
        const list = new SubscriptionList()
        const subscription = subscriptions.created
        list.add(subscription)
        list.add(subscription)
        const all = list.getAll()
        expect(all).toHaveLength(1)
        expect(all).toEqual([subscription])
      })
    }
  })

  describe('remove', () => {
    it('should remove the requested subscription', () => {
      const list = new SubscriptionList()
      list.add(subscriptions.created)
      list.add(subscriptions.deleted)
      list.add(subscriptions.updated)
      list.remove(subscriptions.deleted)
      const all = list.getAll()
      expect(all).toHaveLength(2)
      expect(all).toEqual([subscriptions.created, subscriptions.updated])
    })

    it('should allow removal of unexisting subscription', () => {
      const list = new SubscriptionList()
      list.add(subscriptions.created)
      list.add(subscriptions.deleted)
      list.add(subscriptions.updated)
      list.remove(subscriptions.updated33)
      const all = list.getAll()
      expect(all).toHaveLength(3)
    })

    if (allowDoubleSubscriptions) {
      describe('for duplicate subscriptions', () => {
        if (requireDoubleUnsubscriptions) {
          it('removes only one subscription', () => {
            const list = new SubscriptionList()
            list.add(subscriptions.created)
            list.add(subscriptions.deleted)
            list.add(subscriptions.deleted)
            list.add(subscriptions.updated)
            list.remove(subscriptions.deleted)
            const all = list.getAll()
            expect(all).toHaveLength(3)
          })
        } else {
          it('removes all similar subscriptions', () => {
            const list = new SubscriptionList()
            list.add(subscriptions.created)
            list.add(subscriptions.deleted)
            list.add(subscriptions.deleted)
            list.add(subscriptions.updated)
            list.remove(subscriptions.deleted)
            const all = list.getAll()
            expect(all).toHaveLength(2)
          })
        }
      })
    }
  })

  describe('getAll', () => {
    it('returns all subscriptions', () => {
      const list = new SubscriptionList()
      const requested = Object.values(subscriptions)
      for (const item of requested) {
        list.add(item)
      }
      const all = list.getAll()
      expect(all).toHaveLength(requested.length)
      expect(all.sort()).toEqual(requested.sort())
    })
    it('does not return a reference to its internal array', () => {
      // avoid messing by error with the internal structure of SubscriptionList
      const list = new SubscriptionList()
      const requested = Object.values(subscriptions)
      for (const item of requested) {
        list.add(item)
      }
      list.getAll().pop() // mutate the returned result
      const all = list.getAll()
      expect(all).toHaveLength(requested.length)
    })
  })

  describe('getAllTypeAndIdPairs', () => {
    it('should return the different type and id pairs', () => {
      const list = new SubscriptionList()
      list.add(subscriptions.updated)
      list.add(subscriptions.updatedAlbum)
      list.add(subscriptions.updated33)
      const pairs = list.getAllTypeAndIdPairs()
      expect(pairs).toEqual(
        expect.arrayContaining([
          { type: subscriptions.updated.type, id: subscriptions.updated.id },
          {
            type: subscriptions.updatedAlbum.type,
            id: subscriptions.updatedAlbum.id
          },
          { type: subscriptions.updated33.type, id: subscriptions.updated33.id }
        ])
      )
    })

    it('should not return duplicates', () => {
      const list = new SubscriptionList()
      list.add(subscriptions.updated)
      list.add(subscriptions.deleted)
      list.add(subscriptions.created)
      list.add(subscriptions.updatedAlbum)
      list.add(subscriptions.updated33)
      const pairs = list.getAllTypeAndIdPairs()
      expect(pairs).toHaveLength(3)
    })
  })

  describe('hasSameTypeAndId', () => {
    it('should return true when there is a similar subscription', () => {
      const list = new SubscriptionList()
      list.add(subscriptions.updated)
      const has = list.hasSameTypeAndId(subscriptions.created)
      expect(has).toBeTruthy()
    })

    it('should return false when there is not a similar subscription', () => {
      const list = new SubscriptionList()
      list.add(subscriptions.updatedAlbum)
      const has = list.hasSameTypeAndId(subscriptions.updated)
      expect(has).toBeFalsy()
    })

    it('should normalize falsy values', () => {
      const list = new SubscriptionList()
      list.add(subscriptions.created)
      const nully = list.hasSameTypeAndId({
        ...subscriptions.updated,
        id: null
      })
      expect(nully).toBeTruthy()
      const falsy = list.hasSameTypeAndId({
        ...subscriptions.updated,
        id: false
      })
      expect(falsy).toBeTruthy()
      const undefy = list.hasSameTypeAndId({
        ...subscriptions.updated,
        id: undefined
      })
      expect(undefy).toBeTruthy()
    })
  })

  describe('getAllHandlersForEvent', () => {
    it('returns an empty array when there are no matching event', () => {
      const list = new SubscriptionList()
      list.add(subscriptions.updated)
      list.add(subscriptions.deleted)
      list.add(subscriptions.created)
      list.add(subscriptions.updatedAlbum)
      list.add(subscriptions.updated33)
      const event = 'CREATED'
      const type = 'io.cozy.notes'
      const matching = list.getAllHandlersForEvent(event, type)
      expect(matching).toEqual([])
    })

    it('returns the matching handlers', () => {
      const list = new SubscriptionList()
      list.add(subscriptions.updated)
      list.add(subscriptions.deleted)
      list.add(subscriptions.created)
      list.add(subscriptions.updatedAlbum)
      list.add(subscriptions.updated33)
      const event = 'UPDATED'

      const type = 'io.cozy.files'
      const id = '33'
      const matching = list.getAllHandlersForEvent(event, type, id)
      expect(matching).toEqual(
        expect.arrayContaining([
          subscriptions.updated.handler,
          subscriptions.updated33.handler
        ])
      )
    })

    it('match events with undefined id', () => {
      // for undefined vs null
      const list = new SubscriptionList()
      list.add(subscriptions.created)
      const event = 'CREATED'
      const type = 'io.cozy.files'
      const matching = list.getAllHandlersForEvent(event, type)
      expect(matching).toHaveLength(1)
    })
  })

  describe('isEmpty', () => {
    it('return truthy for an empty subscription list', () => {
      const list = new SubscriptionList()
      expect(list.isEmpty()).toBeTruthy()
      list.add(subscriptions.updated)
      list.remove(subscriptions.updated)
      expect(list.isEmpty()).toBeTruthy()
    })

    it('returns falsy when there is a subscription', () => {
      const list = new SubscriptionList()
      list.add(subscriptions.updated)
      expect(list.isEmpty()).toBeFalsy()
      list.remove(subscriptions.updated)
      list.add(subscriptions.created)
      expect(list.isEmpty()).toBeFalsy()
    })
  })
})
