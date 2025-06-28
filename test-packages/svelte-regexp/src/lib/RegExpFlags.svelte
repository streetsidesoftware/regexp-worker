<script lang="ts">
    import { tooltip } from './tooltip.svelte.js';

    interface FlagInfo {
        flag: string;
        description: string;
    }

    const flagInfo: FlagInfo[] = [
        { flag: 'd', description: 'Generate indices for substring matches.' },
        { flag: 'g', description: 'Global search.' },
        { flag: 'i', description: 'Case-insensitive search.' },
        {
            flag: 'm',
            description: 'Line Matching - Makes ^ and $ match the start and end of each line instead of those of the entire string.',
        },
        { flag: 's', description: 'Allows . to match newline characters.' },
        { flag: 'u', description: 'Unicode - treat a pattern as a sequence of Unicode code points.' },
        { flag: 'v', description: 'Extended Unicode - An upgrade to the u mode with more Unicode features.' },
        {
            flag: 'y',
            description: 'Sticky - Perform a "sticky" search that matches starting at the current position in the target string.',
        },
        { flag: 'x', description: 'Extended (non-standard) - allow free-spacing and line comments.' },
    ];

    let { value = $bindable<string>() } = $props();
    let flagSet = $derived(calcFlags(value));

    function calcFlags(flags: string): Set<string> {
        const current = new Set([...flags]);
        return new Set(flagInfo.map((info) => info.flag).filter((flag) => current.has(flag)));
    }

    function toggleFlag(flag: string) {
        if (flagSet.has(flag)) {
            flagSet.delete(flag);
        } else {
            // Special handling for 'v' and 'u' flags to ensure they are mutually exclusive
            if (flag === 'v' || flag === 'u') {
                flagSet.delete('v');
                flagSet.delete('u');
            }
            flagSet.add(flag);
        }
        value = Array.from(flagSet).join('');
    }
</script>

{#snippet Flag(flag: string, description: string, enabled: boolean)}
    <button class={[{ enabled }]} onclick={() => toggleFlag(flag)} title={description} use:tooltip>
        {flag}
    </button>
{/snippet}

<div class="regexp-flags">
    {#each flagInfo as { flag, description }}
        {@render Flag(flag, description, flagSet.has(flag))}
    {/each}
</div>

<style>
    .regexp-flags {
        display: block;
        background-color: #444;
        color: #fff;
    }
    .enabled {
        background-color: #f0f0f0f0;
        color: var(--svelte-regexp-flag-enabled-color, #080);
        font-weight: bold;
    }

    button {
        display: inline-block;
        padding: 0.4em 0.4em;
        margin: 0.1em;
        max-height: 3em;
        background-color: #f0f0f044;
        border-radius: 4px;
        font-family: monospace;
        cursor: default;
    }

    button:hover {
        background-color: #f0f0f088;
    }

    button:hover.enabled {
        background-color: #f0f0f0c0;
    }
</style>
