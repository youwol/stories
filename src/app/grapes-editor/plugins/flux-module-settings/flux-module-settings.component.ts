import * as grapesjs from 'grapesjs'

import { render } from './script'

const componentType = 'flux-module-settings'

export function fluxModuleSettingsComponent(editor: grapesjs.Editor) {
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
                        name: 'toolbox',
                        type: 'text',
                        label: 'Toolbox',
                    },
                    {
                        name: 'version',
                        type: 'text',
                        label: 'Version',
                    },
                    {
                        name: 'module',
                        type: 'text',
                        label: 'Module',
                    },
                ],
            },
            initialize() {
                this.on('change:attributes:toolbox', () => {
                    this.view.render()
                })
                this.on('change:attributes:module', () => {
                    this.view.render()
                })
                this.on('change:attributes:version', () => {
                    this.view.render()
                })
            },
        },
    })
}
