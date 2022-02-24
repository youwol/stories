export function getMiscBlocks() {
    return [
        {
            id: 'markdown',
            label: 'Markdown',
            category: {
                id: 'Misc',
                label: 'Misc',
                open: false,
            },
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
            category: {
                id: 'Misc',
                label: 'Misc',
                open: false,
            },
            content: {
                type: 'mathjax-editor',
            },
            render({ el }: { el: HTMLElement }) {
                el.classList.add('gjs-fonts', 'gjs-f-b2')
            },
        },
        {
            id: 'flux-app',
            label: 'Flux App',
            category: {
                id: 'Misc',
                label: 'Misc',
                open: false,
            },
            content: {
                type: 'flux-app',
            },
            render({ el }: { el: HTMLElement }) {
                el.classList.add('gjs-fonts', 'gjs-f-b2')
            },
        },
        {
            id: 'custom-view',
            label: 'Custom View',
            category: {
                id: 'Misc',
                label: 'Misc',
                open: false,
            },
            content: {
                type: 'custom-view',
            },
            render({ el }: { el: HTMLElement }) {
                el.classList.add('gjs-fonts', 'gjs-f-b2')
            },
        },
        {
            id: 'npm-package',
            label: 'Npm package',
            category: {
                id: 'Misc',
                label: 'Misc',
                open: false,
            },
            content: {
                type: 'npm-package',
            },
            render({ el }: { el: HTMLElement }) {
                el.classList.add('gjs-fonts', 'gjs-f-b2')
            },
        },
        {
            id: 'module-settings',
            label: 'module-settings',
            category: {
                id: 'Misc',
                label: 'Misc',
                open: false,
            },
            content: {
                type: 'flux-module-settings',
            },
            render({ el }: { el: HTMLElement }) {
                el.classList.add('gjs-fonts', 'gjs-f-b2')
            },
        },
    ]
}
