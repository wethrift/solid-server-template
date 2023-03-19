import { css } from '@emotion/css'
import theme from './theme.js'

// cache the media querie syntax
const mq = theme.breakpoints.map(bp => `@media (min-width: ${bp})`)

function _css(styleObject) {
  return css(
    Object.keys(styleObject).reduce((acc, key) => {
      const value = styleObject[key]
      if (typeof value === 'string') {
        acc[key] = theme.colors[value] || value
      } else if (Array.isArray(value)) {
        acc[key] = value[0]
        for (let i = 1; i < value.length; i++) {
          if (value[i]) {
            acc[mq[i - 1]] = {
              [key]: value[i],
            }
          }
        }
      } else if (typeof value === 'object') {
        acc[key] = _css(value)
      } else {
        acc[key] = value
      }
      return acc
    }, {})
  )
}

export default _css
