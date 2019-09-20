/* eslint-disable no-console */

// TODO can be removed when https://github.com/cozy/cozy-libs/pull/479
// is merged
global.window = { cordova: false }

/* CLI used in development to generate emails from template and data */
const { EMAILS, renderTemplate } = require('./common-test')

const main = () => {
  const express = require('express')
  const app = express()

  app.get('/:templateName/:lang', async function(req, res) {
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
      const renderedTemplate = await renderTemplate(templateName, lang)
      res.send(nav + '<br/><br/>' + renderedTemplate)
    } catch (e) {
      res.send('Error while rendering template. <pre>' + e.stack + '</pre>')
    }
  })

  app.get('/', function(req, res) {
    res.redirect(`/${Object.keys(EMAILS)[0]}/fr`)
  })

  const port = 8081
  app.listen(port, () =>
    console.log(`Rendering emails at http://localhost:${port}!`)
  )
}

main(process.argv)
