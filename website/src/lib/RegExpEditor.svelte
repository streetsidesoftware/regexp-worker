<script lang="ts">
    import type { ParsedEntry } from './regexpParsing.js';
    import { parseRegExp } from './regexpParsing.js';
    let { source = $bindable(), flags = $bindable() } = $props<{ source: string, flags: string }>();

    let astEntries: ParsedEntry[] | undefined = $derived.by(() => {
        try {
            return parseRegExp(source, flags);
        } catch (e) {
            return undefined;
        }
    });

    let fragments = $derived.by(() => entriesToFragments(source, astEntries));

    $inspect(astEntries);

    function entriesToFragments(source: string, entries: ParsedEntry[] | undefined): Fragment[] {
        if (!entries) {
            return [{ content: source, className: undefined }];
        }
        return entries.map((entry) => {
            let className: string | undefined;
            switch (entry.type) {
                case 'Text':
                    className = undefined;
                    break;
                case 'Comment':
                    className = 'comment';
                    break;
                case 'Char':
                    className = 'char';
                    break;
                case 'Group':
                    className = `group brace-level-${(entry.depth || 0) + 1}`;
                    break;
                default:
                    className = 'expression'
            }
            return { className, content: entry.text };
        });
    }

    interface Fragment {
        className?: string;
        content: string;
    }
</script>

{#snippet rFragment(f: Fragment)}{#if f.className}<span class={f.className}>{f.content}</span>{:else}{f.content}{/if}{/snippet}

{#snippet rFragments(frags: Fragment[])}{#each frags as f, index (index)}{@render rFragment(f)}{/each}{/snippet}

<div class="container">
<div class="regexp-edit behind" contenteditable="plaintext-only">{@render rFragments(fragments)}</div>
<div class="regexp-edit in-front" bind:textContent={source} contenteditable="plaintext-only"></div>
</div>

<style>
.container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}
.regexp-edit {
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
    background-color: var(--color-bg-1, #f5f5f5);
}

.behind {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--color-bg-1, #f5f5f5);
    z-index: 1;
}

.in-front {
    position: relative;
    z-index: 10;
    color: #33333310;
    background-color: #00000000;
    caret-color: var(--color-caret, #000);
}

.expression {
    color: #bb9900
}

.comment {
    color: #696;
}

.char {
    color: #333;
}

.brace-level-1 { color: #e06c75; }
.brace-level-2 { color: #d19a66; }
.brace-level-3 { color: #e5c07b; }
.brace-level-4 { color: #98c379; }
.brace-level-5 { color: #56b6c2; }
.brace-level-6 { color: #61afef; }
.brace-level-7 { color: #c678dd; }
</style>
