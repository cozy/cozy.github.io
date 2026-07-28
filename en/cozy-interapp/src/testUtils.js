export const mockAPI = () => {
  const routes = []

  const respond = (method, path, response, filter) => {
    const route = {
      method,
      path,
      response,
      filter
    }
    routes.push(route)
  }

  const fetch = async (method, path, data) => {
    const route = routes.find(route => {
      const { method: rmethod, path: rpath, filter } = route
      if (method !== rmethod || path !== rpath) {
        return false
      }
      if (filter && !filter(data)) {
        return false
      }
      return true
    })
    if (!route) {
      throw new Error(`404 for ${method} ${path}`)
    }
    return route.response
  }

  const reset = () => {
    return routes.splice(0, routes.length)
  }

  return {
    respond,
    fetch,
    reset
  }
}

export const sleep = async delay => {
  return new Promise(resolve => {
    setTimeout(resolve, delay)
  })
}
