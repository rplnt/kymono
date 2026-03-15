{if $user_id eq true}
<script type="application/json" id="kymono.bookmarks">
{get_bookmarks}
[
{foreach from=$get_bookmarks item=bookmark_category name=cats}
  {ldelim}
    "id": {$bookmark_category.node_id|@json_encode nofilter},
    "name": {$bookmark_category.node_name|strip_tags|strip|@json_encode nofilter},
    "unread": {$bookmark_category.sum|@json_encode nofilter},
    "children": [
{foreach from=$bookmark_category.children item=bookmark name=bookmarks}
      {ldelim}
        "id": {$bookmark.node_id|@json_encode nofilter},
        "name": {$bookmark.node_name|stripslashes|@json_encode nofilter},
        "unread": {$bookmark.node_user_subchild_count|@json_encode nofilter},
        "hasDescendants": {if $bookmark.lastdescendant_created > $bookmark.last_visit}true{else}false{/if},
        "lastVisit": {$bookmark.last_visit|@json_encode nofilter}
      {rdelim}{if !$smarty.foreach.bookmarks.last},{/if}
{/foreach}
    ]
  {rdelim}{if !$smarty.foreach.cats.last},{/if}
{/foreach}
]
</script>
{/if}
