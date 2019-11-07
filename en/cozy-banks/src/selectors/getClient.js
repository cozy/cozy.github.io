let client
const getClient = () => {
  if (!client) {
    client = window.cozyClient
  }
  return client
}

export default getClient
