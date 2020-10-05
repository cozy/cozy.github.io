import { createContext, useContext } from 'react'

const RouterContext = createContext()

export const useParams = () => {
  const { params } = useRouter()
  return params
}

export const useRouter = () => {
  return useContext(RouterContext)
}

export default RouterContext
