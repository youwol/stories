import * as grapesjs from 'grapesjs'

import { render } from './script'

export function fluxAppComponent(editor: grapesjs.Editor) {
    editor.DomComponents.addType('flux-app', {
        extendFn: ['initialize'],
        isComponent: (el: HTMLElement) => {
            console.log(el.tagName)
            return el.tagName == 'FLUX-APP'
        },
        model: {
            defaults: {
                script: render,
                tagName: 'flux-app',
                droppable: false,
                traits: [
                    {
                        name: 'app',
                        type: 'text',
                        label: "Application's id",
                    },
                ],
            },
            initialize() {
                this.on('change:attributes:app', () => {
                    this.view.render()
                })
            },
        },
    })
}
