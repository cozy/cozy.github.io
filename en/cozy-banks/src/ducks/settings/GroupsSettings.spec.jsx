import React from 'react'
import { createMockClient } from 'cozy-client/dist/mock'
import { render } from '@testing-library/react'
import { within } from '@testing-library/dom'

import { GROUP_DOCTYPE, ACCOUNT_DOCTYPE, schema } from 'doctypes'
import fixtures from 'test/fixtures'
import AppLike from 'test/AppLike'
import GroupsSettings from './GroupsSettings'

const setup = () => {
  const client = createMockClient({
    queries: {
      groups: {
        doctype: GROUP_DOCTYPE,
        data: fixtures[GROUP_DOCTYPE]
      },
      accounts: {
        doctype: ACCOUNT_DOCTYPE,
        data: fixtures[ACCOUNT_DOCTYPE]
      }
    },
    clientOptions: {
      schema
    }
  })

  const root = render(
    <AppLike client={client}>
      <GroupsSettings />
    </AppLike>
  )

  return { root }
}

describe('GroupsSettings', () => {
  it('should show groups sorted by their label', () => {
    const { root } = setup()
    // Check that rows are in the right order by first querying rows, then
    // querying their content
    const rows = root.queryAllByRole('row')
    within(rows[2]).getByText('Famille élargie')
    within(rows[2]).getByText(
      'Compte courant Isabelle, Compte jeune Louise, Compte courant Claude, Compte courant Genevieve'
    )
    within(rows[3]).getByText('Isabelle')
    within(rows[3]).getByText(
      'Compte courant Isabelle, Compte jeune Louise, Livret A Isabelle'
    )
  })
})
