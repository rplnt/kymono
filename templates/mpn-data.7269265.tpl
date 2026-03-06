{if $user_id eq true}
<script type="application/json" id="kymono.mpn">
{get_userlist}
[
{foreach from=$active_friends item=active_friend name=friends}
  {ldelim}"id": {$active_friend.user_action_id|@json_encode nofilter}, "name": {$active_friend.user_action|strip_tags|trim|@json_encode nofilter}{rdelim},
{/foreach}
{foreach from=$active_users item=active_user name=users}
  {ldelim}"id": {$active_user.user_action_id|@json_encode nofilter}, "name": {$active_user.user_action|strip_tags|trim|@json_encode nofilter}{rdelim}{if !$smarty.foreach.users.last},{/if}
{/foreach}
]
</script>
{/if}
