export function getMiscBlocks() {
    return [
        {
            id: 'markdown',
            label: 'Markdown',
            category: 'Misc',
            content: {
                type: 'markdown-editor',
            },
            render({ el }: { el: HTMLElement }) {
                el.classList.add('gjs-fonts', 'gjs-f-b2')
            },
        },
    ]
}
