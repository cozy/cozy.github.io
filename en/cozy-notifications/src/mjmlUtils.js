import mjml2html from 'mjml'

export const renderMJML = mjmlContent => {
  const obj = mjml2html(mjmlContent, { validationLevel: 'strict' })
  return obj.html
}
