import React from 'react'

import { withStyles } from 'cozy-ui/transpiled/react/styles'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Figure from 'cozy-ui/transpiled/react/Figure'
import Card from 'cozy-ui/transpiled/react/Card'
import { Media, Bd, Img } from 'cozy-ui/transpiled/react/deprecated/Media'
import Typography from 'cozy-ui/transpiled/react/Typography'

import { getCurrencySymbol } from 'utils/currencySymbol'
import useEstimatedBudget from './useEstimatedBudget'

const HeaderCard = withStyles({
  card: {
    backgroundColor: 'var(--headerInvertedBackgroundColorLight)',
    border: 0
  }
})(({ classes, children }) => {
  return <Card className={classes.card}>{children}</Card>
})

const HeaderInfoCard = () => {
  const { t } = useI18n()
  const { estimatedBalance, currency, transactions } = useEstimatedBudget()

  if (estimatedBalance === null) {
    return null
  }

  return (
    <HeaderCard>
      <Media>
        <Bd>
          <Typography variant="h6" color="primary">
            {t('EstimatedBudget.30-day-balance')}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {t('EstimatedBudget.numberEstimatedTransactions', {
              smart_count: transactions.length
            })}
          </Typography>
        </Bd>
        <Img>
          <Figure
            className="u-ml-2"
            total={estimatedBalance}
            symbol={getCurrencySymbol(currency)}
          />
        </Img>
      </Media>
    </HeaderCard>
  )
}

export default React.memo(HeaderInfoCard)
