import React from 'react'
import { render } from '@testing-library/react'
import AppLike from 'test/AppLike'
import { createMockClient } from 'cozy-client/dist/mock'
import useRedirectionURL from 'hooks/useRedirectionURL'
import { KONNECTOR_DOCTYPE, schema } from 'doctypes'
import KonnectorUpdateInfo from './index'

jest.mock('hooks/useRedirectionURL')

describe('KonnectorUpdateInfo', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  const setup = ({ outdatedKonnectors }) => {
    const client = createMockClient({
      queries: {
        outdatedKonnectors: {
          lastUpdate: new Date(),
          data: outdatedKonnectors,
          doctype: KONNECTOR_DOCTYPE,
          hasMore: false
        }
      },
      clientOptions: {
        schema
      }
    })
    const root = render(
      <AppLike client={client}>
        <KonnectorUpdateInfo />
      </AppLike>
    )
    return { root }
  }

  it('should display button with valid url', () => {
    useRedirectionURL.mockReturnValue([
      'http://store.cozy.tools:8080/#/discover/?type=konnector&category=banking&pendingUpdate=true'
    ])
    const { root } = setup({
      outdatedKonnectors: [
        {
          _id: 'io.cozy.konnectors/caissedepargne1',
          categories: 'banking',
          slug: 'caissedepargne1'
        }
      ]
    })

    const link = root.getByText('Update my banks').closest('a')
    expect(link.getAttribute('href')).toEqual(
      'http://store.cozy.tools:8080/#/discover/?type=konnector&category=banking&pendingUpdate=true',
      () => {}
    )
  })
})
