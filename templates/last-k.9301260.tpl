{if $user_id eq true}
{get_temp_k}
<script type="application/json" id="kymono.lastk">
{$get_temp_k|@json_encode nofilter}
</script>
{/if}
