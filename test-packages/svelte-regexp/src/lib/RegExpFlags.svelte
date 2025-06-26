<script lang="ts">
    import { tooltip } from './tooltip.svelte.js';

    interface FlagInfo {
        flag: string;
        description: string;
    }

    const flags: FlagInfo[] = [
        { flag: 'd', description: 'Generate indices for substring matches.' },
        { flag: 'g', description: 'Global search.' },
        { flag: 'i', description: 'Case-insensitive search.' },
        { flag: 'm', description: 'Makes ^ and $ match the start and end of each line instead of those of the entire string.' },
        { flag: 's', description: 'Allows . to match newline characters.' },
        { flag: 'u', description: '"Unicode"; treat a pattern as a sequence of Unicode code points.' },
        { flag: 'v', description: 'An upgrade to the u mode with more Unicode features.' },
        { flag: 'y', description: 'Perform a "sticky" search that matches starting at the current position in the target string.' },
    ];
</script>

{#each flags as { flag, description }}
    <code title={description} use:tooltip>{flag}</code>
{/each}

<style>
    code {
        display: inline-block;
        padding: 0em 0.4em;
        margin: 0.1em;
        background-color: #f0f0f044;
        border-radius: 4px;
        font-family: monospace;
        cursor: default;
    }
</style>
