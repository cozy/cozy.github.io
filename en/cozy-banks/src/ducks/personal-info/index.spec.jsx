import React from 'react'
import { render, fireEvent } from '@testing-library/react'

import { createMockClient } from 'cozy-client/dist/mock'

import sleep from 'utils/sleep'
import AppLike from 'test/AppLike'
import { PersonalInfoPage } from '.'

describe('PersonalInfo', () => {
  const setup = async ({ onSaveSuccessful } = {}) => {
    const client = await createMockClient({
      queries: {
        myself: {
          doctype: 'io.cozy.contacts',
          data: [
            {
              _id: '1337',
              birthcity: 'Paris'
            }
          ]
        }
      }
    })
    const root = render(
      <AppLike client={client}>
        <PersonalInfoPage onSaveSuccessful={onSaveSuccessful} />
      </AppLike>
    )

    return { root, client }
  }

  it('should show a form', async () => {
    const { root } = await setup()

    const inp = await root.findByPlaceholderText('Where you are born')
    await root.findByText('Birth city')
    expect(inp.value).toBe('Paris')

    await root.findByText('Nationality')
    // TODO test nationality selectbox value
  })

  it('should save into the myself contact', async () => {
    const onSaveSuccessful = jest.fn()
    const { root, client } = await setup({
      onSaveSuccessful
    })

    const inp = await root.findByPlaceholderText('Where you are born')

    fireEvent.change(inp, { target: { value: 'Pau' } })
    expect(inp.value).toBe('Pau')

    const btn = await root.findByRole('button')
    fireEvent.click(btn)
    expect(client.save).toHaveBeenCalledWith({
      _id: '1337',
      _type: 'io.cozy.contacts',
      birthcity: 'Pau',
      id: '1337',
      nationality: 'FR'
    })

    await sleep(0)
    expect(onSaveSuccessful).toHaveBeenCalledWith({
      _id: '1337',
      _type: 'io.cozy.contacts',
      birthcity: 'Pau',
      id: '1337',
      nationality: 'FR'
    })
  })
})
