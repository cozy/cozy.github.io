import React, {
  createContext,
  useEffect,
  useState,
  useContext,
  useMemo
} from 'react'
import { useLocation } from 'react-router-dom'

export const SelectedTagsContext = createContext()

export const useSelectedTags = () => {
  const context = useContext(SelectedTagsContext)
  if (!context) {
    throw new Error(
      'useSelectedTagsContext must be used within a SelectedTagsProvider'
    )
  }
  return context
}

const SelectedTagsProvider = ({ children }) => {
  const [selectedTags, setSelectedTags] = useState([])
  const location = useLocation()

  useEffect(() => {
    // We want to keep the list of selected tags when navigating from one
    // categories page to another, but unload it when exiting this set of
    // routes
    if (!location.pathname.startsWith('/analysis/categories')) {
      setSelectedTags([])
    }
  }, [location])

  const value = useMemo(() => [selectedTags, setSelectedTags], [selectedTags])

  return (
    <SelectedTagsContext.Provider value={value}>
      {children}
    </SelectedTagsContext.Provider>
  )
}

export default SelectedTagsProvider
