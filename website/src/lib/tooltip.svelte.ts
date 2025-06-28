// Originally from: https://svelte.dev/playground/dd6754a2ad0547c5b1c1ea37c0293fef?version=5.34.8

export function tooltip(node: HTMLElement) {
    $effect(() => {
        const tooltip = _tooltip(node);

        return tooltip.destroy;
    });
}

function _tooltip(element: HTMLElement) {
    let div: HTMLDivElement | undefined;
    let title: string | null = '';

    function mouseOver(_event: MouseEvent) {
        // NOTE: remove the `title` attribute, to prevent showing the default browser tooltip
        // remember to set it back on `mouseleave`
        title = element.getAttribute('title');
        element.removeAttribute('title');
        const rect = element.getBoundingClientRect();

        div = document.createElement('div');
        div.textContent = title;
        div.style = `
            color: #333;
			border: 1px solid #ccc;
			box-shadow: 1px 1px 3px #ccc;
			background: #e0e0e0;
			border-radius: 4px;
			padding: 4px;
			position: absolute;
			top: ${rect.top + 70}px;
			left: ${rect.left + 5}px;
		`;
        document.body.appendChild(div);
    }

    function mouseLeave() {
        if (div) {
            document.body.removeChild(div);
            div = undefined;
        }
        if (title) {
            // NOTE: restore the `title` attribute
            element.setAttribute('title', title);
        }
    }

    element.addEventListener('mouseover', mouseOver);
    element.addEventListener('mouseleave', mouseLeave);

    return {
        destroy() {
            element.removeEventListener('mouseover', mouseOver);
            element.removeEventListener('mouseleave', mouseLeave);
        }
    };
}
