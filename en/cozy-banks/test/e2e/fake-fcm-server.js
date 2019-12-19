/* eslint-disable no-console */

const express = require('express')
const port = 3001

const app = express()
app.use(express.json())

app.get(/.*/, (req, res) => {
  console.log(req.originalUrl)
  console.log(req.body.body)
  res.send('OK')
})
app.post(/.*/, (req, res) => {
  console.log(req.originalUrl)
  console.log(req.body)
  res.send('OK')
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
