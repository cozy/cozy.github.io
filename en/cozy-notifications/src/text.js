/**
 * Tools to (crudly) convert HTML to text, used to build the text version email
 * from its HTML version.
 */

const cheerio = require('cheerio')
const wrap = require('word-wrap')

const getContentDefault = $ => {
  const beforeContent = $('.before-content')
  const txtElements = beforeContent.nextAll().find('h1,h2,h3,h4,h5,p,a')

  let content = ''
  txtElements.each((index, txtElement) => {
    const txt = $(txtElement).text().trim()
    switch (txtElement.tagName.toLowerCase()) {
      case 'h1':
        content += '# ' + txt + '\n\n'
        break
      case 'h2':
        content += '## ' + txt + '\n\n'
        break
      case 'h3':
        content += '### ' + txt + '\n\n'
        break
      case 'h4':
        content += '#### ' + txt + '\n\n'
        break
      case 'h5':
        content += '##### ' + txt + '\n\n'
        break
      case 'p':
        content += '' + txt + '\n\n'
        break
      case 'a':
        content +=
          '[' +
          txt.replace(/\n/g, '').replace(/\s+/g, ' ') +
          '](' +
          txtElement.attribs.href +
          ')\n\n'
        break
      default:
        throw new Error('Unrecognized tagName ' + txtElement.tagName)
    }
  })

  return content
}

export const toText = (cozyHTMLEmail, getContentArg) => {
  const getContent = getContentArg || getContentDefault

  const $ = cheerio.load(cozyHTMLEmail)
  const title = $('.header__title').text().trim()
  const descTitle = $('.header__desc__title').text().trim()
  const descSubtitle = $('.header__desc__subtitle').text().trim()
  return wrap(
    `# Cozy - ${title}${
      descTitle || descSubtitle ? `\n\n## ${descTitle} - ${descSubtitle}\n` : ''
    }

${getContent($)}
`,
    { width: 80 }
  )
}
