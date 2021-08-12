import { useSelector } from 'react-redux'

const useFilteringDoc = () => {
  return useSelector(state => state.filters && state.filters.filteringDoc)
}

export default useFilteringDoc
