{if $user_id eq true}
<script type="application/json" id="kymono.replies">
{get_user_submissions_children listing_amount=12}
[
{foreach from=$get_user_submissions_children item=child name=replies}
  {ldelim}"node_id": {$child.node_id|@json_encode nofilter}, "node_name": {$child.node_name|strip_tags|trim|@json_encode nofilter}, "node_parent": {$child.node_parent|@json_encode nofilter}, "parent_name": {$child.parent_name|strip_tags|trim|@json_encode nofilter}, "node_creator": {$child.node_creator|@json_encode nofilter}, "login": {$child.login|strip_tags|trim|@json_encode nofilter}, "node_content": {$child.node_content|strip_tags:false|strip_tags|stripslashes|truncate:100:"...":true|@json_encode nofilter}, "node_created": "{$child.node_created}", "creatorImageUrl": "{get_image_link id=$child.node_creator}"{rdelim}{if !$smarty.foreach.replies.last},{/if}
{/foreach}
]
</script>
{/if}
