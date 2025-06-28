<script lang="ts">
    import Playground from '$lib/Playground.svelte';
</script>

<svelte:head>
    <title>Home</title>
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
    <br />
    <p>
        Regular Expressions can suffer from <a href="https://www.regular-expressions.info/catastrophic.html">Catastrophic Backtracking</a> .
        A very simple expression like <code>/(x+x+)+y/</code> can cause your JavaScript application to freeze. This library allows you to run
        these expressions on another thread. If they take to long to complete, they are terminated, protecting your application from locking
        up.
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

    h1 {
        width: 100%;
    }
</style>
