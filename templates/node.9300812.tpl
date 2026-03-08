{if $user_id eq true}
{if $node.template_id eq 2 || $node.template_id eq 14}
{get_children listing_amount=$listing_amount offset=$offset orderby=$listing_order}
<script type="application/json" id="kymono.node">
{ldelim}
"node": {$node|@json_encode nofilter},
"nodeImageUrl": "{get_image_link id=$node.node_id}",
"creatorImageUrl": "{get_image_link id=$node.node_creator}",
"canWrite": {if $permissions.w eq true}true{else}false{/if},
"anticsrf": "{$anticsrf}",
"listing_amount": {$listing_amount},
"offset": {$offset},
"node_views": {$node.node_views|default:0},
"children": {$get_children|@json_encode nofilter}
{rdelim}
</script>
{else}
{get_threaded_children link='yes' listing_amount=$listing_amount offset=$offset orderby=$listing_order}
<script type="application/json" id="kymono.node">
{ldelim}
"node": {$node|@json_encode nofilter},
"nodeImageUrl": "{get_image_link id=$node.node_id}",
"creatorImageUrl": "{get_image_link id=$node.node_creator}",
"canWrite": {if $permissions.w eq true}true{else}false{/if},
"anticsrf": "{$anticsrf}",
"listing_amount": {$listing_amount},
"offset": {$offset},
"node_views": {$node.node_views|default:0},
"children": {$get_threaded_children|@json_encode nofilter}
{rdelim}
</script>
{/if}
{/if}
