<script lang="ts">
    import type { MatchAllAsRangePairsResult } from 'regexp-worker';
    import { createRegExpWorker, TimeoutError } from 'regexp-worker';
    import { usageText } from './lib/usage-text';
    import RegExpFlags from './lib/RegExpFlags.svelte';
    import ErrorMsg from './lib/ErrorMsg.svelte';

    const defaultRegexp = /(?<=(^|\s)`).*?(?=`(\s|$))/gm;
    const sampleText = usageText;

    let worker = $state(createRegExpWorker(1000, 20000));
    let regexpSource = $state(defaultRegexp.source);
    let regexpFlags = $state(defaultRegexp.flags);
    let text = $state(sampleText);
    let result: MatchAllAsRangePairsResult | undefined = $state(undefined);
    let lastError: TimeoutError | undefined = $state(undefined);
    let lastRequestTime = $state(0);
    let fragments = $derived.by(() => calcFragments(text, result));
    let innerText = $state(sampleText);
    let regexp = $derived.by(() => toRegExpOrError(regexpSource, regexpFlags));
    let requests = $state(0);
    let count = $state(0);
    let busy = $state(false);
    let lastText = '';
    let lastRegexp: RegExp | undefined = undefined;
    const textIds = new Map<string, number>();

    $effect(() => {
        if (regexp instanceof Error) return;
        if (busy) return; // Avoid concurrent requests
        if (regexp && text && lastRegexp?.toString() === regexp.toString() && lastText === text) return; // Avoid unnecessary updates
        lastRegexp = regexp;
        lastText = text;
        busy = true;
        requests++;
        const startTime = performance.now();
        matchAllWords(regexp, text)
            .then((res) => {
                count++;
                if (res instanceof TimeoutError) {
                    lastError = res;
                    result = undefined;
                    return;
                }
                lastError = undefined;
                result = res;
            })
            .finally(() => {
                busy = false;
                lastRequestTime = performance.now() - startTime;
            });
    });

    $effect(() => {
        if (innerText === text) return; // Avoid unnecessary updates
        text = innerText;
    });

    type FragmentType = 'text' | 'mark' | 'br';
    interface Fragment {
        id: string; // Unique ID for each fragment
        type: FragmentType;
        content: string;
        text: string; // the adjusted text for spacing
    }

    function getTextId(text: string): number {
        const id = textIds.get(text) || textIds.size + 1;
        textIds.set(text, id);
        return id;
    }

    function toRegExpOrError(source: string, flags: string): RegExp | Error {
        try {
            return new RegExp(source, flags);
        } catch (error) {
            return error instanceof Error ? error : new Error(`Invalid RegExp: ${error}`);
        }
    }

    function calcFragments(text: string, result: MatchAllAsRangePairsResult | undefined): Fragment[] {
        const idMap = new Map<string, number>();
        const fragments: Fragment[] = [];
        const matches = result?.ranges || [];
        let i = 0;
        for (const [start, end] of matches) {
            if (i > end) continue;

            if (i < start) {
                addFrag('text', text.slice(i, start));
            }
            addFrag('mark', text.slice(start, end));
            i = end;
        }
        if (i < text.length) {
            addFrag('text', text.slice(i));
        }
        return fragments;

        function addId(f: { id?: string; type: FragmentType; content: string }): Fragment {
            const { type, content } = f;
            const key = `${type}-${getTextId(content)}`;
            const n = (idMap.get(key) || 0) + 1;
            idMap.set(key, n);
            f.id = `frag-${key}-${n}`;
            const frag = f as Fragment;
            frag.text = content; // .replaceAll('  ', ' .'); // Adjust text for spacing
            return frag;
        }

        function addFrag(type: FragmentType, content: string) {
            fragments.push(addId({ type, content }));
            // const lines = content.split('\n');
            // fragments.push(addId({ type, content: lines[0] }));
            // for (let j = 1; j < lines.length; j++) {
            //     fragments.push(addId({ type: 'br', content: '' })); // Add a break for each line
            //     fragments.push(addId({ type, content: lines[j] }));
            // }
        }
    }

    async function matchAllWords(regexp: RegExp, text: string) {
        try {
            const result = await worker.matchAllAsRangePairs(text, regexp);
            return result;
        } catch (error) {
            if (error instanceof TimeoutError) return error;
            throw error;
        }
    }
</script>

<main>
    <div class="wrapper">
        <div class="box header"><h1>RegExp Worker</h1></div>
        <div class="box sidebar">
            <div>
                <dl>
                    <dt>RegExp:</dt>
                    <dd><input bind:value={regexpSource} /></dd>
                    <dt>Flags: <RegExpFlags /></dt>
                    <dd><input bind:value={regexpFlags} /></dd>
                    <dt>Count:</dt>
                    <dd><span class="fixed_width">{count}/{requests}</span></dd>
                    <dt>
                        Elapsed Time:
                        {#if busy}
                            <i>'working...'</i>
                        {:else if result}
                            <i>{result.ranges.length} matches</i>
                        {/if}
                    </dt>
                    <dd>
                        {#if lastError}
                            <pre class="warning">{lastError.elapsedTimeMs.toFixed(4)}ms timeout</pre>
                        {:else if result}
                            <pre>{result.elapsedTimeMs.toFixed(4).padStart(lastRequestTime.toFixed(4).length, ' ')}ms in Worker</pre>
                        {:else}
                            <span class="fixed_width">N/A</span>
                        {/if}
                    </dd>
                    <dd>
                        <pre>{lastRequestTime.toFixed(4)}ms Roundtrip</pre>
                    </dd>
                    <dt>Last Error:</dt>
                    <dd>
                        {#if regexp instanceof Error}
                            <ErrorMsg error={regexp} />
                        {:else if lastError}
                            <ErrorMsg error={lastError} />
                        {:else}
                            <span class="fixed_width">None</span>
                        {/if}
                    </dd>
                </dl>
            </div>
        </div>
        <div class="box content">
            <div class="edit_container">
                <div class="beneath" contenteditable="plaintext-only">
                    {#each fragments as frag (frag.id)}{#if frag.type === 'mark'}<mark>{frag.text}</mark>{:else if frag.type === 'br'}<br
                            />{:else}{frag.text}{/if}{/each}
                </div>
                <div class="edit_box" bind:innerText contenteditable="plaintext-only"></div>
            </div>
        </div>
        <div class="box footer"></div>
    </div>
</main>

<style>
    dl {
        text-align: left;
        word-wrap: break-word;
    }

    dd > input {
        width: 80%;
        /* box-sizing: border-box; */
        padding: 4px;
        margin: 4px 0;
    }

    mark {
        background-color: #cf4;
        color: #0000;
    }
    .edit_container {
        font-family: monospace;
        box-sizing: border-box;
        background-color: #f9f9f9;
        color: white;
        padding: 10px;
        left: 0;
        top: 0;
        min-height: 500px;
        width: 100%;
        margin: 0;
    }
    .edit_box {
        color: black;
        font-family: monospace;
        box-sizing: border-box;
        position: relative;
        text-align: left;
        padding: 10px;
        min-height: 300px;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: #f9f9f9;
    }
    .warning {
        color: yellow;
    }

    .fixed_width {
        font-family: monospace;
    }

    [contenteditable] {
        padding: 10px;
        color: #090909;
        caret-color: green;
        background-color: #f0f0f044;
        text-wrap: wrap;
    }

    .beneath {
        box-sizing: border-box;
        position: absolute;
        padding: 10px;
        top: 15px;
        left: 15px;
        right: 15px;
        text-align: left;
        /* width: 100%; */
        text-wrap: wrap;
        color: #00000040;
        background-color: #f9f9f900;
        box-sizing: border-box;
        overflow-wrap: break-word;
    }
</style>
