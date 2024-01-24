import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { Media, Bd, Img } from 'cozy-ui/transpiled/react/deprecated/Media'
import RightIcon from 'cozy-ui/transpiled/react/Icons/Right'
import Typography from 'cozy-ui/transpiled/react/Typography'
import Icon from 'cozy-ui/transpiled/react/Icon'
import Figure from 'cozy-ui/transpiled/react/Figure'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import { getCurrencySymbol } from 'utils/currencySymbol'

import Skeleton from 'components/Skeleton'
import Elevated from 'components/Elevated'
import useEstimatedBudget from './useEstimatedBudget'

const FutureBalanceCard = () => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const { isLoading, estimatedBalance, currency, transactions } =
    useEstimatedBudget()

  const navigate = useNavigate()
  const handleClick = useCallback(() => {
    navigate('/balances/future')
  }, [navigate])

  return (
    <Elevated
      onClick={handleClick}
      className={`${isMobile ? 'u-mv-1 u-mh-half' : 'u-m-1'} u-p-1`}
    >
      <Media>
        <Bd>
          <Typography variant="body1">
            {t('EstimatedBudget.30-day-balance')}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {isLoading ? (
              <Skeleton variant="text" />
            ) : (
              t('EstimatedBudget.numberEstimatedTransactions', {
                smart_count: transactions.length
              })
            )}
          </Typography>
        </Bd>
        <Img>
          {isLoading ? (
            <Skeleton variant="text" width="small" />
          ) : (
            <Figure
              className="u-mr-1 u-slateGrey"
              total={estimatedBalance}
              symbol={getCurrencySymbol(currency)}
            />
          )}
        </Img>
        <Img>
          <Icon icon={RightIcon} size={16} className="u-coolGrey" />
        </Img>
      </Media>
    </Elevated>
  )
}

export default FutureBalanceCard
