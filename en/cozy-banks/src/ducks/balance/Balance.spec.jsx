/* global shallow */

import getClient from 'test/client'
const React = require('react')
const { DumbBalance } = require('./Balance')
const debounce = require('lodash/debounce')
import fixtures from 'test/fixtures'

jest.mock('lodash/debounce', () => jest.fn(fn => fn))

jest.useFakeTimers()

const fakeCollection = (doctype, data) => ({
  data: data || []
})

describe('Balance page', () => {
  let root, instance, saveDocumentMock, router, filterByAccounts

  const setup = ({ accountsData } = {}) => {
    saveDocumentMock = jest.fn()
    filterByAccounts = jest.fn()
    router = {
      push: jest.fn()
    }
    const settingDoc = {}
    root = shallow(
      <DumbBalance
        accounts={fakeCollection('io.cozy.bank.accounts', accountsData || [])}
        virtualAccounts={[]}
        groups={fakeCollection('io.cozy.bank.groups')}
        virtualGroups={[]}
        settings={fakeCollection('io.cozy.bank.settings', [settingDoc])}
        triggers={fakeCollection('io.cozy.triggers')}
        transactions={fakeCollection('io.cozy.bank.operations')}
        saveDocument={saveDocumentMock}
        filterByAccounts={filterByAccounts}
        router={router}
        client={getClient()}
      />
    )
    instance = root.instance()
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should call filterByAccounts prop with getCheckAccounts', () => {
    setup()
    let accounts = []
    instance.getCheckedAccounts = () => {
      return accounts
    }
    root.instance().handleClickBalance()
    expect(router.push).toHaveBeenCalledWith('/balances/details')
    expect(filterByAccounts).toHaveBeenCalledWith(accounts)
  })

  describe('data fetching', () => {
    it('should start periodic data fetch if no accounts', () => {
      setup()
      jest.spyOn(instance, 'startRealtimeFallback')
      jest.spyOn(instance, 'stopRealtimeFallback')
      instance.ensureListenersProperlyConfigured()
      expect(instance.startRealtimeFallback).toHaveBeenCalled()
      expect(instance.startRealtimeFallback).toHaveBeenCalled()
    })
    it('should stop periodic data fetch if there are accounts', () => {
      const accounts = fixtures['io.cozy.bank.accounts']
      setup({ accountsData: accounts })
      jest.spyOn(instance, 'startRealtimeFallback')
      jest.spyOn(instance, 'stopRealtimeFallback')
      instance.ensureListenersProperlyConfigured()
      expect(instance.startRealtimeFallback).not.toHaveBeenCalled()
      expect(instance.stopRealtimeFallback).toHaveBeenCalled()
    })

    it('should correctly start realtime fallback', () => {
      setup()
      jest
        .spyOn(global, 'setInterval')
        .mockReset()
        .mockImplementation(() => 1337)
      instance.startRealtimeFallback()
      expect(global.setInterval).toHaveBeenCalledWith(
        instance.updateQueries,
        30000
      )
      expect(global.setInterval).toHaveBeenCalledTimes(1)
      instance.startRealtimeFallback()
      expect(global.setInterval).toHaveBeenCalledTimes(1)
    })

    it('should correctly stop realtime fallback', () => {
      setup()
      jest
        .spyOn(global, 'setInterval')
        .mockReset()
        .mockImplementation(() => 1337)
      jest
        .spyOn(global, 'clearInterval')
        .mockReset()
        .mockImplementation(() => {})
      instance.startRealtimeFallback()
      instance.stopRealtimeFallback()
      expect(global.clearInterval).toHaveBeenCalledWith(1337)
      expect(instance.realtimeFallbackInterval).toBe(null)
      instance.stopRealtimeFallback()
      expect(global.clearInterval).toHaveBeenCalledTimes(1)
    })
  })

  describe('panel toggling', () => {
    it('should debounce handlePanelChange', () => {
      setup({ accountsData: [{ balance: 12345 }] })
      expect(debounce).toHaveBeenCalledWith(instance.handlePanelChange, 3000, {
        leading: false,
        trailing: true
      })
    })

    it('should call savePanelState when handling panel change', () => {
      setup()
      instance.setState = (fn, callback) => callback.apply(instance)
      jest.spyOn(instance, 'savePanelState')
      instance.handlePanelChange()
      instance.handlePanelChange()
      instance.handlePanelChange()
      expect(instance.savePanelState).toHaveBeenCalledTimes(3)
    })

    it('should call saveDocument when saving panel state', () => {
      setup()
      instance.savePanelState()
      expect(saveDocumentMock).toHaveBeenCalled()
    })
  })
})
