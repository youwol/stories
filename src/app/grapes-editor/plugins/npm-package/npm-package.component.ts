import * as grapesjs from 'grapesjs'

import { render } from './script'

const componentType = 'npm-package'

export function npmPackageComponent(editor: grapesjs.Editor) {
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
                        type: 'text',
                        name: 'package',
                    },
                ],
            },
            initialize() {
                this.on('change:attributes:package', () => {
                    this.view.render()
                })
            },
        },
    })
}
