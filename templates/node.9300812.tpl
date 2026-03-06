{if $user_id eq true}
{get_threaded_children link='yes' listing_amount=$listing_amount offset=$offset orderby=$listing_order}
<script type="application/json" id="kymono.node">
{ldelim}
"node": {$node|@json_encode nofilter},
"canWrite": {if $permissions.w eq true}true{else}false{/if},
"listing_amount": {$listing_amount},
"offset": {$offset},
"children": {$get_threaded_children|@json_encode nofilter}
{rdelim}
</script>
{/if}
