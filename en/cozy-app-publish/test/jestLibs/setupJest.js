/* eslint-env jest */

const fetch = require('jest-fetch-mock')
jest.doMock('node-fetch', () => fetch.mockResponse({ status: 201 }))
