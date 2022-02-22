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
                type: 'mathjax-editor',
            },
            render({ el }: { el: HTMLElement }) {
                el.classList.add('gjs-fonts', 'gjs-f-b2')
            },
        },
        {
            id: 'flux-app',
            label: 'Flux App',
            category: 'Misc',
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
            category: 'Misc',
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
            category: 'Misc',
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
            category: 'Misc',
            content: {
                type: 'flux-module-settings',
            },
            render({ el }: { el: HTMLElement }) {
                el.classList.add('gjs-fonts', 'gjs-f-b2')
            },
        },
        {
            id: 'js-playground',
            label: 'Js Playground',
            category: 'Education',
            content: {
                type: 'js-playground',
            },
            render({ el }: { el: HTMLElement }) {
                el.classList.add('gjs-fonts', 'gjs-f-b2')
            },
        },
    ]
}
