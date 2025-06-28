<script lang="ts">
    let { error } = $props<{ error: Error }>();
    let messageLines = $derived(error.message.replaceAll(': ', ':\n ').split('\n'));
</script>

<dl>
    <dt><code class="warning">{error.name || 'Error'}:</code></dt>
    {#each messageLines as line, index (index)}
        <dd><code class="warning">{line}</code></dd>
    {/each}
</dl>
<code class="warning"></code>

<style>
    .warning {
        color: yellow;
    }
</style>
