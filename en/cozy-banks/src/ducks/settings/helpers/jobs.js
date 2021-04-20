export const transformJobsToFakeAccounts = jobsInProgress => {
  const jobsInAccounts = jobsInProgress.map(j => ({
    inProgress: true,
    connection: {
      raw: {
        _id: j.account
      },
      data: j.account
    },
    connectionId: j.account,
    cozyMetadata: {
      createdByApp: j.konnector
    },
    institutionLabel: j.institutionLabel
  }))
  return jobsInAccounts
}
