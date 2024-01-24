import React, { useState } from 'react'
import { useClient } from 'cozy-client'
import flag from 'cozy-flags'
import Alerter from 'cozy-ui/transpiled/react/deprecated/Alerter'
import Typography from 'cozy-ui/transpiled/react/Typography'
import Button from 'cozy-ui/transpiled/react/deprecated/Button'
import { PanelContent } from 'cozy-client/dist/devtools'

const startAndWaitService = async (client, serviceName) => {
  const jobs = client.collection('io.cozy.jobs')
  const { data: job } = await jobs.create('service', {
    name: serviceName,
    slug: flag('banking.banking-app-slug') || 'banks'
  })
  const finalJob = await jobs.waitFor(job.id)
  if (finalJob.state === 'errored') {
    Alerter.error(`Job finished with error. Error is ${finalJob.error}`)
  } else if (finalJob.state === 'done') {
    Alerter.success(`Job finished successfully`)
  } else {
    Alerter.error(`Job finished with state ${finalJob.state}`)
  }
  return finalJob
}

const ServiceButton = ({ name: serviceName, client }) => {
  const [running, setRunning] = useState(false)
  const startService = async () => {
    try {
      setRunning(true)
      await startAndWaitService(client, serviceName)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
      Alerter.error(`Something wrong happened, see console.`)
    } finally {
      setRunning(false)
    }
  }
  return (
    <Button
      busy={running}
      label={`Run ${serviceName} service`}
      onClick={() => startService(serviceName)}
    />
  )
}

const ServiceDevTools = () => {
  const client = useClient()
  return (
    <PanelContent>
      <Typography variant="subtitle1" gutterBottom>
        Services
      </Typography>
      <ServiceButton client={client} name="autogroups" />
      <ServiceButton client={client} name="categorization" />
      <ServiceButton client={client} name="onOperationOrBillCreate" />
      <ServiceButton client={client} name="budgetAlerts" />
    </PanelContent>
  )
}

export default ServiceDevTools
