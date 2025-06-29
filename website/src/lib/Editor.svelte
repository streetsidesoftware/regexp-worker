<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        content?: string;
        format?: (content: string | undefined) => ReturnType<Snippet>;
    }

    let { content = $bindable(), format }: Props = $props();
</script>

<div class="container">
    {#if format}
        <div class="editable behind" contenteditable="plaintext-only">{@render format(content)}</div>
        <div class="editable in-front" bind:textContent={content} contenteditable="plaintext-only"></div>
    {:else}
        <div class="editable" bind:textContent={content} contenteditable="plaintext-only"></div>
    {/if}
</div>

<style>
    .container {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
    }
    .editable {
        width: 100%;
        height: 100%;
        font-family: monospace;
        font-size: 1rem;
        line-height: 1.5;
        padding: 0.5rem;
        box-sizing: border-box;
        overflow-y: auto;
        white-space: pre-wrap; /* Preserve whitespace and line breaks */
        border-radius: 5px;
        border: 1px solid var(--color-border, #ccc);
        color: var(--color-text, #333);
        background-color: var(--color-bg, #f5f5f5);
    }

    .editable.behind {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--color-bg, #f5f5f5);
        z-index: 1;
    }

    .editable.in-front {
        position: relative;
        z-index: 10;
        color: var(--color-overlay, #33333310);
        background-color: #00000000;
        caret-color: var(--color-caret, #000);
    }
</style>
