class Request {
  constructor(cozyClient) {
    this.stackClient = cozyClient.stackClient
  }

  get(id, { tryDOM = false } = {}) {
    if (tryDOM) {
      const intentFromDOM = this.fromDOM()
      if (intentFromDOM && intentFromDOM.id === id) {
        return Promise.resolve(intentFromDOM)
      }
    }

    return this.stackClient.fetchJSON('GET', `/intents/${id}`).then(resp => {
      const intent = resp.data
      return normalizeIntent(intent)
    })
  }

  post(action, type, data, permissions) {
    return this.stackClient
      .fetchJSON('POST', '/intents', {
        data: {
          type: 'io.cozy.intents',
          attributes: {
            action: action,
            type: type,
            data: data,
            permissions: permissions
          }
        }
      })
      .then(resp => resp.data)
  }

  fromDOM() {
    if (typeof document !== 'undefined') {
      const node = document.getElementById('cozy-intent')
      if (node) {
        const intent = JSON.parse(node.textContent)
        return normalizeIntent(intent)
      }
    }
  }
}

const normalizeIntent = intent => {
  if (!intent._id) intent._id = intent.id
  return intent
}

export default Request
