{if $user_id eq true}
<script type="application/json" id="kymono.friendList">{$friends|@json_encode nofilter}</script>
{/if}
