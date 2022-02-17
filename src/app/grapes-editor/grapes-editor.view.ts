import { HTMLElement$, VirtualDOM } from '@youwol/flux-view'
import { resizablePanel } from '@youwol/fv-group'
import * as grapesjs from 'grapesjs'
import { createGrapesEditor$ } from './editor'
import { applyPatches } from './patches'
import { plugCommands } from './commands'

export class GrapesEditorView implements VirtualDOM {
    public readonly id: string
    public readonly class = 'w-100 d-flex'
    public readonly children: VirtualDOM[]

    connectedCallback: (elem: HTMLElement$ & HTMLDivElement) => void

    constructor({ idPrefix }: { idPrefix: string }) {
        const settingsView = new SettingsView({ idPrefix })

        this.id = `editor-row`
        this.children = [
            {
                id: 'gjs',
                class: 'flex-grow-1 p-2 fv-border-primary',
            },
            resizablePanel(settingsView, 'Toolboxes', 'right', {
                minWidth: 195,
            }),
        ]

        this.connectedCallback = () => {
            createGrapesEditor$().subscribe((editor) => {
                plugCommands(editor)
                editor.BlockManager.getCategories().each((ctg) =>
                    ctg.set('open', false),
                )
                settingsView.overallSettings.addPanels(editor)
                settingsView.attributesEditor.header.addPanel(editor)

                applyPatches(editor)
            })
        }
    }
}

export class SettingsView implements VirtualDOM {
    public readonly id: string
    public readonly class = 'flex-grow-1 gjs-one-bg fv-color-primary'

    public readonly overallSettings: OverallSettings
    public readonly attributesEditor: AttributesEditor

    public readonly children: VirtualDOM[]

    constructor({ idPrefix }: { idPrefix: string }) {
        this.id = `${idPrefix}-grapes-settings`
        this.overallSettings = new OverallSettings({ idPrefix })
        this.attributesEditor = new AttributesEditor({ idPrefix })
        this.children = [this.overallSettings, this.attributesEditor]
    }
}

export class OverallSettings implements VirtualDOM {
    static idBasicActions = 'panel__layout-basic-actions'
    static idDeviceActions = 'panel__layout-devices-actions'
    static panels = (idPrefix) => [
        {
            id: 'layout-basic-actions',
            el: `#${idPrefix}-${OverallSettings.idBasicActions}`,
            buttons: [
                {
                    id: 'visibility',
                    active: true, // active by default
                    className: 'btn-toggle-borders',
                    label: '<i class="fas fa-border-none"></i>',
                    command: 'sw-visibility', // Built-in command
                },
                {
                    id: 'preview',
                    className: 'btn-preview',
                    label: '<i class="fas fa-eye"></i>',
                    command: 'custom-preview', // Built-in command
                },
            ],
        },
        {
            id: 'layout-devices-actions',
            el: `#${idPrefix}-${OverallSettings.idDeviceActions}`,
            buttons: [
                {
                    id: 'desktop',
                    active: true, // active by default
                    className: 'btn-set-device-desktop',
                    label: '<i class="fas fa-desktop"></i>',
                    command: 'set-device-desktop',
                },
                {
                    id: 'tablet',
                    active: false, // active by default
                    className: 'btn-set-device-tablet',
                    label: '<i class="fas fa-tablet-alt"></i>',
                    command: 'set-device-tablet',
                },
                {
                    id: 'mobile landscape',
                    active: false, // active by default
                    className: 'btn-set-device-phone',
                    label: '<i class="fas fa-mobile-alt"></i>',
                    command: 'set-device-mobile-landscape',
                },
                {
                    id: 'mobile portrait',
                    active: false, // active by default
                    className: 'btn-set-device-phone',
                    label: '<i class="fas fa-mobile-alt"></i>',
                    command: 'set-device-mobile-portrait',
                },
            ],
        },
    ]

    public readonly id = 'grapes-overall-settings'
    public readonly class = 'd-flex justify-content-between'
    public readonly idPrefix: string

    public readonly children: VirtualDOM[]

    constructor({ idPrefix }: { idPrefix: string }) {
        this.idPrefix = idPrefix
        this.children = [
            {
                id: `${idPrefix}-${OverallSettings.idBasicActions}`,
                class: 'd-block position-relative  buttons-toolbox',
            },
            {
                id: `${idPrefix}-${OverallSettings.idDeviceActions}`,
                class: 'd-block position-relative buttons-toolbox',
            },
        ]
    }

    addPanels(editor: grapesjs.Editor) {
        OverallSettings.panels(this.idPrefix).forEach((panel) =>
            editor.Panels.addPanel(panel),
        )
    }
}

export class AttributesEditor implements VirtualDOM {
    public readonly header: AttributesEditorHeader
    public readonly body: AttributesEditorBody

    public readonly children: VirtualDOM[]

    constructor({ idPrefix }: { idPrefix: string }) {
        this.header = new AttributesEditorHeader({ idPrefix })
        this.body = new AttributesEditorBody()
        this.children = [this.header, this.body]
    }
}

export class AttributesEditorHeader implements VirtualDOM {
    static idSwitchModeActions = 'panel__render-panels-actions'
    public readonly idPrefix: string
    public readonly id = 'panel__layout-managers-actions'
    public readonly class =
        'd-flex position-relative  flex-align-switch justify-content-between'

    public readonly children: VirtualDOM[]

    static panel = (idPrefix) => ({
        id: 'layout-managers-actions',
        el: `#${idPrefix}-${AttributesEditorHeader.idSwitchModeActions}`,
        buttons: [
            {
                id: 'show-blocks',
                active: true,
                label: '<i class="fas fa-th-large"></i>',
                command: 'show-blocks',
                // Once activated disable the possibility to turn it off
                togglable: false,
            },
            {
                id: 'show-style',
                active: false,
                label: '<i class="fas fa-palette"></i>',
                command: 'show-styles',
                togglable: false,
            },
            {
                id: 'show-traits',
                active: false,
                className: 'fa fa-cog',
                command: 'show-traits',
                attributes: { title: 'Open Trait Manager' },
                togglable: false,
            },
            {
                id: 'show-layers',
                active: false,
                className: 'fa fa-bars',
                command: 'show-layers',
                attributes: { title: 'Open Layer Manager' },
                togglable: false,
            },
            {
                id: 'code',
                className: 'btn-preview',
                label: '<i class="fas fa-code"></i>',
                command: 'open-code', // Built-in command
            },
        ],
    })

    constructor({ idPrefix }: { idPrefix: string }) {
        this.idPrefix = idPrefix
        this.children = [
            {
                id: `${idPrefix}-${AttributesEditorHeader.idSwitchModeActions}`,
                class: 'd-block position-relative buttons-toolbox ',
            },
        ]
    }

    addPanel(editor: grapesjs.Editor) {
        editor.Panels.addPanel(AttributesEditorHeader.panel(this.idPrefix))
    }
}

export class AttributesEditorBody implements VirtualDOM {
    public readonly id = 'editor-row'
    public readonly class = 'overflow-auto  border border-dark panels-container'
    public readonly style = {
        height: 'calc(100% - 80px)',
    }
    public readonly children: VirtualDOM[]

    constructor() {
        this.children = [
            {
                id: 'blocks',
            },
            {
                id: 'styles',
            },
            {
                id: 'traits',
            },
            {
                id: 'layers',
            },
            {
                id: 'codes',
            },
        ]
    }
}
