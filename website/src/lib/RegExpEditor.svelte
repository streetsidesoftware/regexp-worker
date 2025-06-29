<script lang="ts">
    import Editor from './Editor.svelte';
    import type { ParsedEntry } from './regexpParsing.js';
    import { parseRegExp } from './regexpParsing.js';

    let { source = $bindable(), flags = $bindable() } = $props<{ source: string; flags: string }>();

    function contentToEntries(source: string): ParsedEntry[] | undefined {
        try {
            return parseRegExp(source, flags);
        } catch {
            return undefined;
        }
    }

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
                    className = 'expression';
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

<Editor bind:content={source}>
    {#snippet format(content: string | undefined)}
        {@render rFragments(entriesToFragments(content || '', contentToEntries(content || '')))}
    {/snippet}
</Editor>

<style>
    .expression {
        color: #bb9900;
    }

    .comment {
        color: #696;
    }

    .char {
        color: #333;
    }

    .brace-level-1 {
        color: #e06c75;
    }
    .brace-level-2 {
        color: #d19a66;
    }
    .brace-level-3 {
        color: #e5c07b;
    }
    .brace-level-4 {
        color: #98c379;
    }
    .brace-level-5 {
        color: #56b6c2;
    }
    .brace-level-6 {
        color: #61afef;
    }
    .brace-level-7 {
        color: #c678dd;
    }
</style>
