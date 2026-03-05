<div id="kmn" style="display: none">
<children-data parent="{$node.node_id}" vector_depth="{$node.vector_depth}">
{get_threaded_children link='yes' listing_amount=$listing_amount offset=$offset orderby=$listing_order}
{foreach from=$get_threaded_children item=child}
{if $child.template_id neq 1549834 and $child.external_link neq "session://fook"}
  <child
    node="{$child.node_id}"
    depth="{$child.depth}"
    template="{$child.template_id}"
    created="{$child.node_created|date_format:'%Y-%m-%dT%H:%M:%S'}"
    updated="{if $child.node_updated neq false}{$child.node_updated|date_format:'%Y-%m-%dT%H:%M:%S'}{/if}"
    k="{$child.k}"
    children="{$child.node_children_count}"
    new="{if $child.node_created > $node.last_visit and !$child.orphan}yes{/if}"
    orphan="{if $child.node_created > $node.last_visit and $child.orphan}yes{/if}"
    changed="{if $child.node_updated > $node.last_visit}yes{/if}"
    status="{$child.node_status}"
    image="{get_image_link id=$child.node_creator}"
  >
    <name><![CDATA[{$child.node_name}]]></name>
    <owner node="{$child.node_creator}">{$child.login|escape:'html'}</owner>
    <parent node="{$child.node_parent}"></parent>
    <content><![CDATA[{if $child.nl2br == 1}{$child.node_content|nl2br}{else}{$child.node_content}{/if}]]></content>
  </child>
{/if}
{/foreach}
</children-data>
</div>
