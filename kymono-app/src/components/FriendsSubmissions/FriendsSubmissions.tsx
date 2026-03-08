import { useFriends } from '@/contexts'
import { CONFIG_PATHS } from '@/config'
import { SubmissionsList } from './SubmissionsList'

export function FriendsSubmissions() {
  const { isFriend } = useFriends()
  return (
    <SubmissionsList
      title="friends.submissions"
      slug="friends-submissions"
      emptyMessage="No submissions from friends"
      enabledPath={CONFIG_PATHS.FRIENDS_SUBMISSIONS_ENABLED}
      filter={(item) => isFriend(item.creatorId)}
    />
  )
}
