import { CONFIG_PATHS } from '@/config'
import { SubmissionsList } from '@/components/FriendsSubmissions/SubmissionsList'

export function LatestSubmissions() {
  return (
    <SubmissionsList
      title="latest.submissions"
      slug="latest-submissions"
      emptyMessage="No submissions"
      enabledPath={CONFIG_PATHS.LATEST_SUBMISSIONS_ENABLED}
      defaultEnabled={false}
    />
  )
}
