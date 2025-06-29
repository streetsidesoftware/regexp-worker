<script lang="ts">
    import type { MatchAllAsRangePairsResult } from 'regexp-worker';
    import { createRegExpWorker, TimeoutError, toRegExp } from 'regexp-worker';

    import Editor from './Editor.svelte';
    import ErrorMsg from './ErrorMsg.svelte';
    import RegExpEditor from './RegExpEditor.svelte';
    import RegExpFlags from './RegExpFlags.svelte';
    import { defaultRegexp, usageText } from './usage-text';

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

<div class="wrapper">
    <div class="box header"><h2>RegExp Worker Playground</h2></div>
    <div class="box sidebar">
        <div>
            <dl>
                <dt>Count: <span class="fixed_width">{count}/{requests}</span></dt>
                <dt>
                    Elapsed Time:
                    {#if busy}
                        <i>working...</i>
                    {:else if result}
                        <i>{result.ranges.length} matches</i>
                    {/if}
                </dt>
                <dd>
                    {#if lastError}
                        <pre class="warning">{@render fixedWidth(lastError.elapsedTimeMs)}ms timeout</pre>
                    {:else if result}
                        <pre>{@render fixedWidth(result.elapsedTimeMs)}ms in Worker</pre>
                    {:else}
                        <pre>    N/A</pre>
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
        <div class="v-box grid-regexp">
            <strong>RegExp:</strong>
            <RegExpEditor bind:source={regexpSource} bind:flags={regexpFlags} --color-bg="#f5f5f5" --color-text="#333" --color-caret="#333"
            ></RegExpEditor>
        </div>
        <div class="h-box grid-flags">
            <div>
                <strong>Flags:</strong>
            </div>
            <div class="wide">
                <RegExpFlags bind:value={regexpFlags} />
            </div>
        </div>
        <div class="box grid-editor">
            <Editor bind:content={innerText} --color-bg="#f5f5f5" --color-text="#333" --color-caret="#333">
                {#snippet format()}
                    {@render snipFragments()}
                {/snippet}
            </Editor>
        </div>
    </div>
    <div class="box footer"></div>
</div>

<style>
    dl {
        text-align: left;
        word-wrap: break-word;
    }

    dd {
        font-size: 13px;
        margin-left: 0.5em;
    }

    mark {
        background-color: #cf4;
        color: #000;
    }
    .warning {
        color: yellow;
    }

    .fixed_width {
        font-family: var(--font-mono);
    }

    .nested-wrapper {
        width: 100%;
        display: grid;
        box-sizing: border-box;
        grid-gap: 0px;
        grid-template-columns: auto;
        grid-template-areas:
            'regexp'
            'flags'
            'editor';
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

    .sidebar {
        grid-area: sidebar;
    }

    .content {
        grid-area: content;
        position: relative;
    }

    .wrapper {
        width: 100%;
        display: grid;
        box-sizing: border-box;
        grid-gap: 10px;
        grid-template-columns: 260px 33% auto;
        grid-template-areas:
            'header  header header'
            'sidebar content content'
            'footer  footer footer';
        /* background-color: #fff; */
        color: #444;
    }

    .box,
    .v-box,
    .h-box {
        box-sizing: border-box;
        background-color: #444;
        color: #fff;
        padding: 5px;
        font-size: 100%;
    }

    .v-box {
        display: flex;
        flex-direction: column;
    }

    .h-box {
        display: flex;
        flex-direction: row;
    }

    .wide {
        flex: 1;
    }

    .header {
        grid-area: header;
        text-align: center;
    }

    .header {
        box-sizing: border-box;
        padding: 10px;
        background-color: #99999999;
    }

    .footer {
        box-sizing: border-box;
        padding: 10px;
        grid-area: footer;
        /* min-height: 20px; */
    }

    pre {
        font-size: 13px;
        font-family: var(--font-mono);
        background-color: inherit;
        border-radius: 0;
        box-shadow: inherit;
        padding: 0;
        overflow-x: auto;
        color: white;
    }
</style>
