<script lang="ts">
    import type { MatchAllRegExpResult } from 'regexp-worker';
    import { createRegExpWorker } from 'regexp-worker';
    import Counter from './lib/Counter.svelte';

    let worker = $state(createRegExpWorker());
    let html = $state('<p>Write some text!</p>');
    let result: MatchAllRegExpResult | undefined = $state(undefined);

    $effect(() => {
        matchAllWords(html).then((matches) => {
            console.log('Matches:', matches);
            if (matches) {
                result = matches;
            }
        });
    });

    async function matchAllWords(text: string) {
        console.log('Matching words in:', text);
        try {
            const result = await worker.matchAll(text, /\w+/g);
            console.log('Match result:', result);
            return result;
        } catch (error) {
            console.warn('Error matching regex:', error);
        }
        return null;
    }
</script>

<main>
    <h1>RegExp Worker</h1>

    <div class="card">
        <Counter />
    </div>

    <div class="edit_container" bind:innerHTML={html} contenteditable></div>

    <pre>{html}</pre>

    <dl>
        <dt>Elapsed Time:</dt>
        <dd><pre>{result?.elapsedTimeMs.toFixed(4)}ms</pre></dd>

        <dt>Matches: ({result?.matches.length})</dt>
        <dd>{result?.matches.map((m) => m[0]).join(', ')}</dd>
    </dl>
</main>

<style>
    dl {
        text-align: left;
    }
    .edit_container {
        min-height: 100px;
        width: 100%;
        overflow: auto;
        background-color: #f9f9f9;
        margin: 10px;
    }
    [contenteditable] {
        text-align: left;
        padding: 0.5em;
        border: 1px solid #eee;
        border-radius: 4px;
    }
</style>
