{if $user_id eq true}
<script type="application/json" id="kymono.mail">
{get_mail listing_amount=64 offset=0}{$get_mail|@json_encode nofilter}
</script>
{/if}
