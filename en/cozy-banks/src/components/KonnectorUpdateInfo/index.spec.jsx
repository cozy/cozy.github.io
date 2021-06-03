import React from 'react'
import { render } from '@testing-library/react'
import AppLike from 'test/AppLike'
import KonnectorUpdateInfo from './index'
import useRedirectionURL from 'hooks/useRedirectionURL'

jest.mock('hooks/useRedirectionURL')

describe('KonnectorUpdateInfo', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  const setup = ({ outdatedKonnectors }) => {
    const root = render(
      <AppLike>
        <KonnectorUpdateInfo outdatedKonnectors={outdatedKonnectors} />
      </AppLike>
    )
    return { root }
  }

  it('should display button with valid url', () => {
    useRedirectionURL.mockReturnValue([
      'http://store.cozy.tools:8080/#/discover/?type=konnector&category=banking&pendingUpdate=true'
    ])
    const { root } = setup({
      outdatedKonnectors: { data: [{ categories: 'banking' }] }
    })

    const link = root.getByText('Update my banks').closest('a')
    expect(link.getAttribute('href')).toEqual(
      'http://store.cozy.tools:8080/#/discover/?type=konnector&category=banking&pendingUpdate=true',
      () => {}
    )
  })
})
