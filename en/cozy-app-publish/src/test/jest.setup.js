/* eslint-env jest */

const fetch = require('jest-fetch-mock')
jest.doMock('node-fetch', () => fetch.mockResponse({ status: 201 }))

jest.mock('../utils/logger', () => ({
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}))
