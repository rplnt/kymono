{if $user_id eq true}
<script type="application/json" id="kymono.people">
{get_userlist}
[
{foreach from=$active_friends item=active_friend name=friends}
  {ldelim}"id": {$active_friend.user_action_id|@json_encode nofilter}, "name": {$active_friend.user_action|strip_tags|trim|@json_encode nofilter}, "userId": {$active_friend.user_id|@json_encode nofilter}, "login": {$active_friend.login|@json_encode nofilter}, "friend": true, "idleMinutes": {$active_friend.idle_time_minutes}, "idleSeconds": {$active_friend.idle_time_seconds}, "creatorImageUrl": "{get_image_link id=$active_friend.user_id}"{rdelim},
{/foreach}
{foreach from=$active_users item=active_user name=users}
  {ldelim}"id": {$active_user.user_action_id|@json_encode nofilter}, "name": {$active_user.user_action|strip_tags|trim|@json_encode nofilter}, "userId": {$active_user.user_id|@json_encode nofilter}, "login": {$active_user.login|@json_encode nofilter}, "friend": false{rdelim}{if !$smarty.foreach.users.last},{/if}
{/foreach}
]
</script>
{/if}
