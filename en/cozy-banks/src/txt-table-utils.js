import padStart from 'lodash/padStart'
import padEnd from 'lodash/padEnd'
import pad from 'lodash/pad'

const tr = (...tds) => {
  return tds.join(' | ')
}

const padFnByAlign = {
  left: padEnd,
  center: pad,
  right: padStart
}
const td = (str, width, align = 'left') => padFnByAlign[align](str, width, ' ')

export { td, tr }
