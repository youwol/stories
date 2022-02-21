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
        {
            id: 'latext',
            label: 'Latex',
            category: 'Misc',
            content: {
                type: 'latex-editor',
            },
            render({ el }: { el: HTMLElement }) {
                el.classList.add('gjs-fonts', 'gjs-f-b2')
            },
        },
    ]
}
