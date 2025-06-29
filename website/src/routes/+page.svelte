<script lang="ts">
    import Playground from '$lib/Playground.svelte';
</script>

<svelte:head>
    <title>RegExp Worker Playground</title>
    <meta name="description" content="RegExp Worker" />
</svelte:head>

<section>
    <h1>Regular Expression Worker</h1>
    <br />
    <br />
    <p>
        Execute Regular Expression Matches on a Node <a href="https://nodejs.org/api/worker_threads.html">Worker Thread</a> or in a
        <a href="https://developer.mozilla.org/en-US/docs/Web/API/Worker">Web Worker</a>.
    </p>
    <p>
        Regular Expressions can suffer from <a href="https://www.regular-expressions.info/catastrophic.html">Catastrophic Backtracking</a> .
        A very simple expression like <code>/(x+x+)+y/</code> can cause your JavaScript application to freeze. This library allows you to run
        these expressions in another thread, keeping your application responsive. If they take to long to complete, they are terminated, protecting
        your application from locking up.
    </p>
    <p>
        The playground below allows you to test the worker with different regular expressions and content. It will show you the elapsed time
        for the the worker to process the regular expression against the content.
    </p>
    <p>
        <b>Note:</b> The timings shown are rounded to the nearest 1/10 of a millisecond. This is due to the
        <a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated"><code>crossOriginIsolated</code></a>
        property. See also:
        <a href="https://developer.mozilla.org/en-US/docs/Web/API/Performance/now">Performance: now() method - Web APIs | MDN</a>.
    </p>
    <br />

    <Playground />
</section>

<style>
    section {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: left;
        flex: 0.6;
    }

    p {
        text-align: left;
    }

    p + p {
        margin-top: 1em;
    }

    h1 {
        width: 100%;
    }
</style>
