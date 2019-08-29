module.exports = {
  lookup: () => {
    /* eslint-disable no-console */
    console.warn(
      'Mime-types is aliased in banks (for perf). Cannot guess file type.'
    )
    /* eslint-enable no-console */
  }
}
