{if $user_id eq true}
{get_movement_params}
{get_last vector='00' listing_amount=100}
<script type="application/json" id="kymono.friendsSubmissions">
[
{foreach from=$get_last item=child name=subs}
{if $ignore[$child.node_creator] neq true and $friends[$child.node_creator] eq true}
{ldelim}"node_id": {$child.node_id|@json_encode nofilter}, "node_name": {$child.node_name|strip_tags|trim|@json_encode nofilter}, "node_parent": {$child.node_parent|@json_encode nofilter}, "parent_name": {$child.parent_name|strip_tags|trim|@json_encode nofilter}, "node_creator": {$child.node_creator|@json_encode nofilter}, "login": {$child.login|strip_tags|trim|@json_encode nofilter}, "node_content": {$child.node_content|strip_tags:false|strip_tags|stripslashes|truncate:200:"...":true|@json_encode nofilter}, "node_created": "{$child.node_created}", "k": {$child.k|default:0}, "imageUrl": "{get_image_link id=$child.node_creator}"{rdelim},
{/if}
{/foreach}
]
</script>
{/if}
