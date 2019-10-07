module.exports = () => {
  return (
    navigator && navigator.userAgent && navigator.userAgent.includes('Argos')
  )
}
