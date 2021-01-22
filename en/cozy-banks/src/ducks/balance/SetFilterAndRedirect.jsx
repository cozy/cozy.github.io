import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useQuery } from 'cozy-client'
import { useRouter, useParams } from 'components/RouterContext'
import Loading from 'components/Loading'
import {
  accountsConn,
  groupsConn,
  ACCOUNT_DOCTYPE,
  GROUP_DOCTYPE
} from 'doctypes'
import { filterByDoc } from 'ducks/filters'

/**
 * - Checks the params from the URL
 * - Sets filter doc accordingly
 * - Redirects to the right page
 */
const mkSetFilterAndRedirect = () =>
  function SetFilterAndRedirect() {
    const router = useRouter()
    const params = useParams()
    const dispatch = useDispatch()
    const accounts = useQuery(accountsConn.query, accountsConn)
    const groups = useQuery(groupsConn.query, groupsConn)
    useEffect(() => {
      if (
        accounts.fetchStatus === 'loading' ||
        groups.fetchStatus === 'loading'
      ) {
        return
      } else {
        const docId = params.accountOrGroupId
        const account =
          accounts.data && accounts.data.find(x => x._id === docId)
        if (account) {
          dispatch(filterByDoc({ _type: ACCOUNT_DOCTYPE, _id: account._id }))
          router.push(`/balances/${params.page}`)
          return
        }

        const group = groups.data && groups.data.find(x => x._id === docId)
        if (group) {
          dispatch(filterByDoc({ _type: GROUP_DOCTYPE, _id: account._id }))
          router.push(`/balances/${params.page}`)
          return
        }

        // eslint-disable-next-line no-console
        console.warn(`Unknown account or group with id ${docId}`)
        router.push(params.page)
      }
    }, [
      accounts,
      dispatch,
      groups,
      params.accountOrGroupId,
      params.page,
      router
    ])

    if (
      accounts.fetchStatus === 'loading' ||
      groups.fetchStatus === 'loading'
    ) {
      return <Loading />
    }
    return null
  }

export default mkSetFilterAndRedirect
