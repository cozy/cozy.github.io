import { timeFormatDefaultLocale, timeFormat } from 'd3-time-format'
import { select, selectAll, mouse } from 'd3-selection'
import { area, line } from 'd3-shape'
import { drag } from 'd3-drag'
import { extent, bisector } from 'd3-array'
import { easeExpInOut, easeLinear, easeExpIn } from 'd3-ease'
import { scaleLinear, scaleTime } from 'd3-scale'
import { axisBottom } from 'd3-axis'
import { transition } from 'd3-transition'

import d3FrTimeFormat from 'd3-time-format/locale/fr-FR.json'
import d3EnTimeFormat from 'd3-time-format/locale/en-GB.json'

const D3_LOCALES_MAP = {
  fr: d3FrTimeFormat,
  en: d3EnTimeFormat
}

const setupLocale = lang => {
  timeFormatDefaultLocale(D3_LOCALES_MAP[lang] || D3_LOCALES_MAP.en)
}

export {
  timeFormatDefaultLocale,
  timeFormat,
  select,
  selectAll,
  mouse,
  area,
  line,
  drag,
  extent,
  bisector,
  easeExpInOut,
  easeLinear,
  easeExpIn,
  scaleLinear,
  scaleTime,
  axisBottom,
  transition,
  setupLocale
}
