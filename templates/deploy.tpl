<div id="kymono">
{if $user_id eq true}
<script type="application/json" id="kymono.friendList">{$friends|@json_encode nofilter}</script>
<script type="application/json" id="kymono.userId">{$user_id}</script>
{/if}
<div id="root"></div>
<script language="javascript" type="text/javascript" src="https://github.com/rplnt/kymono/releases/download/v2.0.x/bundle.js"></script>
</div>
</body>