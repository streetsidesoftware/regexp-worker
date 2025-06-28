<script lang="ts">
    import type { MatchAllAsRangePairsResult } from 'regexp-worker';
    import { createRegExpWorker, TimeoutError, toRegExp } from 'regexp-worker';
    import { defaultRegexp, usageText } from './lib/usage-text';
    import RegExpFlags from './lib/RegExpFlags.svelte';
    import ErrorMsg from './lib/ErrorMsg.svelte';

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

    type FragmentType = 'text' | 'mark';
    interface Fragment {
        id: string; // Unique ID for each fragment
        type: FragmentType;
        content: string;
    }

    function toRegExpOrError(source: string, flags: string): RegExp | Error {
        try {
            return toRegExp({ source, flags });
        } catch (error) {
            return error instanceof Error ? error : new Error(`Invalid RegExp: ${error}`);
        }
    }

    function calcFragments(text: string, result: MatchAllAsRangePairsResult | undefined): Fragment[] {
        const textIds = new Map<string, number>();
        function getTextId(text: string): number {
            const id = textIds.get(text) || textIds.size + 1;
            textIds.set(text, id);
            return id;
        }

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
            return frag;
        }

        function addFrag(type: FragmentType, content: string) {
            fragments.push(addId({ type, content }));
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

{#snippet snipFragments()}{#each fragments as frag (frag.id)}{#if frag.type === 'mark'}<mark>{frag.content}</mark
            >{:else}{frag.content}{/if}{/each}{/snippet}

{#snippet fixedWidth(value: number, fixed: number = 4, width: number = 9)}
    {value.toFixed(fixed).padStart(width, ' ')}{/snippet}

<main>
    <div class="wrapper">
        <div class="box header"><h1>RegExp Worker</h1></div>
        <div class="box sidebar">
            <div>
                <dl>
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
                            <pre>{@render fixedWidth(result.elapsedTimeMs)}ms in Worker</pre>
                        {:else}
                            <span class="fixed_width">N/A</span>
                        {/if}
                    </dd>
                    <dd>
                        <pre>{@render fixedWidth(lastRequestTime)}ms Roundtrip</pre>
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
        <div class="box content nested-wrapper">
            <div class="box grid-regexp">
                <strong>RegExp:</strong>
                <textarea name="regexp" class="fixed_width regexp-input" bind:value={regexpSource}></textarea>
            </div>
            <div class="box grid-flags">
                <strong>Flags:</strong>
                <div>
                    <RegExpFlags bind:value={regexpFlags} />
                </div>
            </div>
            <div class="box grid-editor">
                <div class="edit_container">
                    <div class="beneath" contenteditable="plaintext-only">{@render snipFragments()}</div>
                    <div class="edit_box" bind:innerText contenteditable="plaintext-only"></div>
                </div>
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

    .nested-wrapper {
        width: 100%;
        display: grid;
        box-sizing: border-box;
        grid-gap: 0px;
        grid-template-columns: 33% 33% auto;
        grid-template-areas:
            'regexp  regexp  flags'
            'editor  editor  editor';
        background-color: #fff;
        color: #444;
    }

    .nested-wrapper.box {
        box-sizing: border-box;
        background-color: #444;
        color: #fff;
        border-radius: 0px;
        padding: 5px;
        font-size: 100%;
    }

    .regexp-input {
        /* display: inline-block; */
        width: 98%;
        /* box-sizing: border-box; */
        min-height: 2em;
        height: 4em;
        field-sizing: content;
        padding: 4px;
        resize: vertical;
        font-family: monospace;
    }

    .grid-regexp {
        grid-area: regexp;
        /* position: relative; */
        padding-top: 0.5em;
    }

    .grid-flags {
        position: relative;
    }
    .grid-editor {
        grid-area: editor;
        position: relative;
    }
</style>
