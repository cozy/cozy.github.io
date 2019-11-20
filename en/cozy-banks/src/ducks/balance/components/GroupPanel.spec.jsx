/* global mount */

import React from 'react'
import data from 'test/fixtures/unit-tests.json'
import GroupPanel, { DumbGroupPanel } from './GroupPanel'
import CozyClient from 'cozy-client'
import mapValues from 'lodash/mapValues'
import fromPairs from 'lodash/fromPairs'
import { schema } from 'doctypes'
import AppLike from 'test/AppLike'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'

jest.mock('selectors')

const addType = data => {
  return mapValues(data, (docs, doctype) => {
    return docs.map(doc => ({ ...doc, _type: doctype }))
  })
}

describe('GroupPanel', () => {
  const rawGroup = data['io.cozy.bank.groups'][0]
  let root, client, group, onChange, switches

  beforeAll(() => {
    client = new CozyClient({
      schema
    })
    client.setData(addType(data))
    group = client.hydrateDocument(
      client.getDocumentFromState('io.cozy.bank.groups', rawGroup._id)
    )
  })

  const fakeRouter = {
    push: jest.fn()
  }

  const Wrapper = ({ expanded }) => (
    <AppLike client={client}>
      <GroupPanel
        expanded={expanded}
        checked={true}
        group={group}
        warningLimit={400}
        switches={switches}
        onSwitchChange={() => {}}
        onChange={onChange}
        router={fakeRouter}
      />
    </AppLike>
  )

  beforeEach(() => {
    switches = fromPairs(
      rawGroup.accounts.map(accId => [
        accId,
        {
          checked: true,
          disabled: false
        }
      ])
    )
    onChange = jest.fn()
    root = mount(<Wrapper expanded={false} />)
  })

  it('should optimistically update', () => {
    const gp = root.find(DumbGroupPanel).instance()
    const ev = {}
    expect(root.find(ExpansionPanel).props().expanded).toBe(false)
    gp.handlePanelChange(ev, true)
    expect(gp.state.optimisticExpanded).toBe(true)
    expect(onChange).toHaveBeenCalledWith(group._id, ev, true)
    root.update()
    expect(root.find(ExpansionPanel).props().expanded).toBe(true)
  })

  it('should prioritize optimizeExpanded', () => {
    const gp = root.find(DumbGroupPanel).instance()
    const ev = {}

    // sanity check
    expect(root.find(ExpansionPanel).props().expanded).toBe(false)

    gp.handlePanelChange(ev, true)
    expect(gp.state.optimisticExpanded).toBe(true)
    expect(onChange).toHaveBeenCalledWith(group._id, ev, true)
    root.update()
    expect(root.find(ExpansionPanel).props().expanded).toBe(true)

    // The request failed but we still want the panel to be toggled
    // We ignore the fact that the request failed as UI coherency
    // is more important for the user
    root.setProps({ expanded: false })
    root.update()
    expect(root.find(ExpansionPanel).props().expanded).toBe(true)
  })
})
