/* eslint-disable no-console */

/* CLI used in development to generate emails from template and data */
const { EMAILS, buildNotificationAttributes } = require('./common-test')

const main = () => {
  const express = require('express')
  const app = express()

  app.get('/:templateName/:lang', async function (req, res) {
    const { templateName, lang } = req.params
    const nav = `
    <div>
      ${Object.keys(EMAILS)
        .map(
          name =>
            `${name}: <a href="/${name}/fr">fr</a>, <a href="/${name}/en">en</a><br/>`
        )
        .join('  ')}
    </div>
    `

    try {
      const { content, content_html } = await buildNotificationAttributes(
        templateName,
        lang
      )

      res.send(`
        ${nav}
        <br/><br/>
        <div>
          <div>
            ${content_html}
          </div>
          <div>
            <pre>${content}</pre>
          </div>
        </div>
      `)
    } catch (e) {
      res.send('Error while rendering template. <pre>' + e.stack + '</pre>')
    }
  })

  app.get('/', function (req, res) {
    res.redirect(`/${Object.keys(EMAILS)[0]}/fr`)
  })

  const port = 8081
  app.listen(port, () =>
    console.log(`Rendering emails at http://localhost:${port}!`)
  )
}

main(process.argv)
