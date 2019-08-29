import React from 'react'
import Types from 'prop-types'
import classNames from 'classnames'
import Figure from 'components/Figure/Figure'
import styles from 'components/Figure/FigureBlock.styl'

/**
 * Shows a `Figure` with a label.
 *
 * A part from `className` and `label`, takes same properties
 * as `Figure`.
 */
const FigureBlock = ({
  className,
  label,
  total,
  symbol,
  coloredPositive,
  coloredNegative,
  signed,
  decimalNumbers = 0,
  figureClassName,
  withCurrencySpacing
}) => (
  <div className={classNames(styles['FigureBlock'], className)}>
    <h4 className={styles['FigureBlock-label']}>{label}</h4>
    <Figure
      size="big"
      className={classNames(styles['FigureBlock-figure'], figureClassName)}
      total={total}
      symbol={symbol}
      coloredPositive={coloredPositive}
      coloredNegative={coloredNegative}
      signed={signed}
      decimalNumbers={decimalNumbers}
      withCurrencySpacing={withCurrencySpacing}
    />
  </div>
)

FigureBlock.propTypes = {
  /** Label of the figure */
  label: Types.string.isRequired,
  /** Extra classname */
  className: Types.string
}

export default FigureBlock
