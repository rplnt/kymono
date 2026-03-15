{if $user_id eq true}
{get_k}
<script type="application/json" id="kymono.k">
{$get_k|@json_encode nofilter}
</script>
{/if}
