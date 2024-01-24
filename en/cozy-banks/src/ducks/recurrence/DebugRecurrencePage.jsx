import React, { useState, useMemo, useCallback } from 'react'

import setWith from 'lodash/setWith'
import sortBy from 'lodash/sortBy'
import clone from 'lodash/clone'
import groupBy from 'lodash/groupBy'

import { useQuery, useClient, isQueryLoading, dehydrate } from 'cozy-client'
import Card from 'cozy-ui/transpiled/react/Card'
import Alerter from 'cozy-ui/transpiled/react/deprecated/Alerter'
import Button from 'cozy-ui/transpiled/react/deprecated/Button'
import Loading from 'components/Loading/Loading'
import Padded from 'components/Padded'
import { transactionsConn } from 'doctypes'
import tree from 'ducks/categories/tree'

import defaultConfig from './config.json'
import {
  saveHydratedBundles,
  resetBundles,
  getAutomaticLabelFromBundle
} from './api'
import RulesDetails from './RulesDetails'
import DateSlider from './DateSlider'
import { getRulesFromConfig, rulesPerName } from './rules'
import { findRecurrences, updateRecurrences } from './search'
import useStickyState from './useStickyState'
import CategoryIcon from 'ducks/categories/CategoryIcon'
import getCategoryId from 'ducks/transactions/getCategoryId'
import Typography from 'cozy-ui/transpiled/react/Typography'

const immutableSet = (object, path, value) => {
  return setWith(clone(object), path, value, clone)
}

const RuleInput = ({ ruleName, config, onChange }) => {
  const handleChangeActive = () => {
    onChange(`${ruleName}.active`, !config.active)
  }

  const handleChangeOptions = ev => {
    const parsed = parseInt(ev.target.value, 10)
    if (isNaN(parsed)) {
      return
    }
    onChange(`${ruleName}.options`, parsed)
  }

  const ruleInfo = rulesPerName[ruleName]
  if (!ruleInfo) {
    return null
  }
  return (
    <div key={ruleName} className="u-m-half u-miw-6">
      {ruleName} (
      <em>
        {ruleInfo.type} - {ruleInfo.stage}
      </em>
      )
      <Typography variant="caption" color="textSecondary">
        {ruleInfo.description}
      </Typography>
      <input
        type="checkbox"
        onChange={handleChangeActive}
        checked={config.active}
      />
      {config.options !== undefined ? (
        <input
          type="text"
          onChange={handleChangeOptions}
          value={config.options}
        />
      ) : null}
    </div>
  )
}

const Rules = ({ rulesConfig, onChangeConfig, onResetConfig }) => {
  const handleChangeRule = useCallback(
    (path, value) => {
      const updatedConfig = immutableSet(rulesConfig, path, value)
      onChangeConfig(updatedConfig)
    },
    [rulesConfig, onChangeConfig]
  )
  const entries = useMemo(() => {
    return sortBy(
      Object.entries(rulesConfig),
      ([ruleName]) => rulesPerName[ruleName].stage
    )
  }, [rulesConfig])
  return (
    <Card className="u-mv-1">
      <RulesDetails />
      <div className="u-flex u-flex-wrap">
        {entries.map(([ruleName, config]) => (
          <RuleInput
            key={ruleName}
            ruleName={ruleName}
            config={config}
            onChange={handleChangeRule}
          />
        ))}
        <button onClick={onResetConfig}>Reset</button>
      </div>
    </Card>
  )
}

const hash = function (str) {
  var hash = 0,
    i,
    chr
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

const palette = [
  '#71c554',
  '#d67cd3',
  '#c5d65b',
  '#8e87e7',
  '#d3a336',
  '#6ba5de',
  '#ec5f62',
  '#69cc8e',
  '#e2779d',
  '#5ccec4',
  '#de8251',
  '#bab16c'
]

const getColor = bundle => {
  const h = Math.abs(hash(getAutomaticLabelFromBundle(bundle)))
  return palette[h % (palette.length - 1)]
}

const CategoryNames = ({ bundle }) => {
  return (
    <div>
      {bundle.categoryIds.map((catId, i) => (
        <div key={i} className="u-flex u-flex-align-center">
          <CategoryIcon
            className="u-ml-0 u-mr-half"
            size={16}
            style={{ width: '1rem' }}
            categoryId={catId}
          />{' '}
          {tree[catId]}
        </div>
      ))}
    </div>
  )
}

const newStyle = { color: 'var(--malachite)' }

const BundleStats = ({ bundle }) => {
  const deltas = bundle.stats ? bundle.stats.deltas : null
  return (
    <>
      mean frequency: {deltas.mean.toFixed(0)} days
      <br />
      median frequency: {deltas.median ? deltas.median.toFixed(0) : null} days
      <br />
      sigma: {deltas.sigma.toFixed(2)}
      <br />
      mad: {deltas.mad.toFixed(2)}
    </>
  )
}

const RecurrenceBundle = ({ bundle }) => {
  const jsonData = useMemo(
    () => JSON.stringify(bundle.ops.map(o => dehydrate(o))),
    [bundle]
  )
  return (
    <Card
      className="u-m-half"
      style={{ border: `2px solid ${getColor(bundle)}` }}
    >
      <Typography variant="h5">
        {getAutomaticLabelFromBundle(bundle)}
      </Typography>
      <input type="text" value={jsonData} />
      <p>
        categories: <CategoryNames bundle={bundle} />
        amounts: {bundle.amounts}
        <br />
        #operations: {bundle.ops.length}
        <br />
        {bundle.stats ? <BundleStats bundle={bundle} /> : null}
      </p>
      <table style={{ fontSize: 'small' }}>
        {sortBy(bundle.ops, x => x.date).map(x => (
          <tr key={x._id} style={x.new ? newStyle : null}>
            <td>
              <CategoryIcon categoryId={getCategoryId(x)} size={8} />
            </td>
            <td>{x.label}</td>
            <td>{x.date.slice(0, 10)}</td>
            <td>{x.amount}</td>
          </tr>
        ))}
      </table>
    </Card>
  )
}

const makeTextFilter = (searchStr, accessor) => {
  const lw = searchStr.toLowerCase()
  return item => {
    if (lw === '') {
      return true
    } else {
      const itemText = accessor(item).toLowerCase()
      return itemText.includes(lw)
    }
  }
}

const DebugRecurrencePage = () => {
  const transactionCol = useQuery(transactionsConn.query, transactionsConn)
  const { data: transactions } = transactionCol
  const loading =
    isQueryLoading(transactionCol) && transactions && transactions.length === 0
  const [rulesConfig, setRulesConfig, clearSavedConfig] = useStickyState(
    defaultConfig,
    'banks.recurrence-config'
  )

  const handleResetConfig = useCallback(() => {
    clearSavedConfig()
    setRulesConfig(defaultConfig)
  }, [clearSavedConfig, setRulesConfig])

  const start = Date.now()
  const handleChangeRules = newRules => setRulesConfig(newRules)

  const rules = useMemo(() => getRulesFromConfig(rulesConfig), [rulesConfig])
  const [bundlesDate, setBundlesDate] = useStickyState(
    '2020-03-01',
    'banks.recurrence.bundleDate'
  )
  const [currentDate, setCurrentDate] = useStickyState(
    '2020-04-01',
    'banks.recurrence.currentDate'
  )
  const [isLocked, setLocked] = useStickyState(false, 'banks.recurrence.locked')

  const bundlesTransactions = useMemo(
    () =>
      transactions
        ? transactions.filter(x =>
            bundlesDate == null ? true : x.date < bundlesDate
          )
        : [],
    [transactions, bundlesDate]
  )

  const bundles = useMemo(
    () => findRecurrences(bundlesTransactions, rules),
    [bundlesTransactions, rules]
  )

  const newTransactions = useMemo(
    () =>
      transactions
        ? transactions
            .filter(x => x.date < currentDate && x.date >= bundlesDate)
            .map(x => ({ ...x, new: true }))
        : [],
    [transactions, currentDate, bundlesDate]
  )

  const [bundleFilter, setBundleFilter] = useStickyState(
    '',
    'banks.recurrence.bundleFilter'
  )

  const updatedBundles = useMemo(() => {
    let curBundles = bundles

    // To mimic as much as possible the entry of new operations per day
    // (a connector is run per day), we update bundles day per day
    const byDay = groupBy(newTransactions, x => x.date.slice(0, 10))
    const days = sortBy(Object.keys(byDay), x => x)
    for (let day of days) {
      const newTransactionsOfDay = byDay[day]
      curBundles = updateRecurrences(bundles, newTransactionsOfDay, rules)
    }
    return curBundles
  }, [bundles, newTransactions, rules])

  const finalBundles = useMemo(() => {
    const filteredBundles = updatedBundles.filter(
      makeTextFilter(bundleFilter, bundle => bundle.ops[0].label)
    )
    const sortedBundles = sortBy(filteredBundles, bundle => bundle.ops[0].label)
    return sortedBundles
  }, [updatedBundles, bundleFilter])

  const client = useClient()

  const [savingBundles, setSavingBundles] = useState()
  const [resettingBundles, setResettingBundles] = useState()
  const handleSaveBundles = useCallback(
    async function () {
      setSavingBundles(true)
      try {
        await saveHydratedBundles(client, finalBundles)
      } catch (error) {
        Alerter.error(error.message)
      } finally {
        setSavingBundles(false)
      }
    },
    [finalBundles, client]
  )

  const handleResetBundles = useCallback(
    async function () {
      setResettingBundles(true)
      try {
        await resetBundles(client)
      } catch (error) {
        Alerter.error(error.message)
      } finally {
        setResettingBundles(false)
      }
    },
    [client]
  )

  const handleChangeBundleFilter = useCallback(
    ev => {
      setBundleFilter(ev.target.value)
    },
    [setBundleFilter]
  )

  const handleSetCurrentDate = useCallback(
    newCurrentDate => {
      if (isLocked) {
        const cd = new Date(currentDate)
        const bd = new Date(bundlesDate)
        const ncd = new Date(newCurrentDate)
        const diff = cd - bd
        const nbd = new Date(ncd - diff)
        setBundlesDate(nbd.toISOString().slice(0, 10))
      }
      setCurrentDate(newCurrentDate)
    },
    [setCurrentDate, setBundlesDate, currentDate, bundlesDate, isLocked]
  )

  const handleSetBundleDate = useCallback(
    newBundleDate => {
      if (isLocked) {
        const cd = new Date(currentDate)
        const bd = new Date(bundlesDate)
        const nbd = new Date(newBundleDate)
        const diff = cd - bd
        const ncd = new Date(+nbd + diff)
        setCurrentDate(ncd.toISOString().slice(0, 10))
      }
      setBundlesDate(newBundleDate)
    },
    [setCurrentDate, setBundlesDate, currentDate, bundlesDate, isLocked]
  )

  const handleSetLocked = useCallback(() => {
    setLocked(!isLocked)
  }, [isLocked, setLocked])

  const end = Date.now()

  return (
    <Padded className="u-ov-scroll">
      <Rules
        rulesConfig={rulesConfig}
        onResetConfig={handleResetConfig}
        onChangeConfig={handleChangeRules}
      />
      <Button
        onClick={handleSaveBundles}
        label="save bundles"
        busy={savingBundles}
      />
      <Button
        onClick={handleResetBundles}
        label="reset bundles"
        busy={resettingBundles}
      />
      <p>
        transactions: {transactions ? transactions.length : 0}
        <br />
        bundleTransactions: {bundlesTransactions.length}
        <br />
        newTransactions: {newTransactions.length}
        <br />
        elapsed time: {(end - start) / 1000}s<br />
        bundle date:{' '}
        <DateSlider date={bundlesDate} onChange={handleSetBundleDate} />
        <br />
        current date:{' '}
        <DateSlider date={currentDate} onChange={handleSetCurrentDate} />
        <br />
        isLocked:{' '}
        <input type="checkbox" checked={isLocked} onChange={handleSetLocked} />
        <br />
        bundle filter:{' '}
      </p>
      <input
        type="text"
        value={bundleFilter}
        onChange={handleChangeBundleFilter}
      />
      <br />
      {loading ? <Loading /> : null}
      <div className="u-flex" style={{ flexWrap: 'wrap' }}>
        {finalBundles.map((bundle, i) => (
          <RecurrenceBundle key={i} bundle={bundle} />
        ))}
      </div>
    </Padded>
  )
}

export default DebugRecurrencePage
