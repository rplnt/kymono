<div id="kmn" style="display: none">
<node-data>
  <node
    node="{$node.node_id}"
    template="{$node.template_id}"
    created="{$node.node_created|date_format:'%Y-%m-%dT%H:%M:%S'}"
    updated="{if $node.node_updated neq false}{$node.node_updated|date_format:'%Y-%m-%dT%H:%M:%S'}{/if}"
    k="{$node.k}"
    image="{get_image_link id=$node.node_id}"
  >
    <name>{$node.node_name|strip_tags|escape:'html'}</name>
    <owner node="{$node.node_creator}">{$node.owner|strip_tags|escape:'html'}</owner>
    <parent node="{$node.node_parent}">{$node.node_parent_name|strip_tags|escape:'html'}</parent>
    <content><![CDATA[{$node.node_content|nl2br|replace:']]>':']]]]><![CDATA[>'}]]></content>
    <ancestors>
{foreach from=$node.ancestors item=ancestor}
      <ancestor node="{$ancestor.link}">{$ancestor.name|strip_tags|escape:'html'}</ancestor>
{/foreach}
    </ancestors>
  </node>
</node-data>
</div>
