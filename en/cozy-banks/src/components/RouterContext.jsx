import { createContext, useContext, useMemo } from 'react'

const RouterContext = createContext()

export const useRouter = () => {
  return useContext(RouterContext)
}

export const useParams = () => {
  const { params } = useRouter()
  return params
}

export const useHistory = () => {
  const router = useRouter()
  const goBack = useMemo(() => {
    return router.goBack.bind(router)
  }, [router])
  const push = useMemo(() => {
    return router.push.bind(router)
  }, [router])
  return { goBack, push }
}

export const useLocation = () => {
  const router = useRouter()
  return router.location
}

export default RouterContext
