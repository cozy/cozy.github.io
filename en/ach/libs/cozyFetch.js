const cozyFetch = function(client, method, path, body) {
  const token = this.client._token.token
  let params = {
    method: method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  }

  if (body) {
    params.body = JSON.stringify(body)
  }
  return fetch(`${this.url}${path}`, params).then(response => {
    let data
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.indexOf('json') >= 0) {
      data = response.json()
    } else {
      data = response.text()
    }

    return response.status === 200 ||
      response.status === 202 ||
      response.status === 204
      ? data
      : data.then(Promise.reject.bind(Promise))
  })
}

module.exports = cozyFetch
