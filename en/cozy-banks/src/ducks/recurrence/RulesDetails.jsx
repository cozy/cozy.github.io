import React from 'react'

const RuleDetails = () => {
  return (
    <details>
      <summary>How rules work</summary>
      <ol>
        <li>
          First operations are grouped into bundles based on their <b>amount</b>{' '}
          and their <b>category</b>.
        </li>
        <li>
          Filtering according to the <b>preStat</b> rules.
        </li>
        <li>
          Then stats are computed on those bundles to compute intervals in days
          between operations, their standard deviation and mean. The idea is to
          be able to remove bundles where operations are not evenly spaced in
          time.
        </li>
        <li>
          Filtering according to the <b>postStat</b> rules.
        </li>
        <li>Merging of similar bundles.</li>
      </ol>
    </details>
  )
}

export default RuleDetails
