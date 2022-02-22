import * as grapesjs from 'grapesjs'

import { render } from './script'

const componentType = 'flux-app'

export function fluxAppComponent(editor: grapesjs.Editor) {
    editor.DomComponents.addType(componentType, {
        extendFn: ['initialize'],
        isComponent: (el: HTMLElement) => {
            return (
                el.getAttribute &&
                el.getAttribute('componentType') == componentType
            )
        },
        model: {
            defaults: {
                script: render,
                droppable: false,
                attributes: {
                    componentType,
                },
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
