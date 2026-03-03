<div id="kmn" style="display: none">

<home-data>

<!--Most Populated Nodes-->
{get_userlist}
<mpn>
{foreach from=$active_friends item=active_friend}
<user id="{$active_friend.user_action_id}">{$active_friend.user_action|strip_tags|trim}</user>
{/foreach}
{foreach from=$active_users item=active_user}
<user id="{$active_user.user_action_id}">{$active_user.user_action|strip_tags|trim}</user>
{/foreach}
</mpn>

</home-data>

</div>