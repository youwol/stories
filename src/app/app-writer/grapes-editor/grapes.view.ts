import { child$, HTMLElement$, VirtualDOM } from '@youwol/flux-view'

import {
    DeviceMode,
    DisplayMode,
    EditorMode,
    GrapesEditorState,
} from './grapes.state'
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs'

import { styleToggleBase, ToggleMenu } from '../utils/utils.view'
import * as grapesjs from 'grapesjs'
import { ToolboxesPanel } from './toolboxes.view'
import { AttributesPanel } from './utils.view'
import { CodeEditorView } from '../code-editor/code-editor.view'

export class GrapesEditorView implements VirtualDOM {
    public readonly state: GrapesEditorState
    public readonly class = 'w-100 d-flex h-100'
    public readonly children: VirtualDOM[]
    public readonly canvasView: CanvasView
    public readonly settingsView: SettingsView
    public readonly editor$: Observable<grapesjs.Editor>
    public readonly connectedCallback: (
        elem: HTMLElement$ & HTMLDivElement,
    ) => void

    constructor(params: { state: GrapesEditorState }) {
        Object.assign(this, params)

        this.canvasView = new CanvasView()
        this.settingsView = new SettingsView(params)

        this.children = [
            {
                class: 'd-flex flex-column w-100 h-100',
                children: [
                    {
                        class: 'h-100 w-100 d-flex flex-column',
                        children: [
                            new OverallSettings(params),
                            this.canvasView,
                        ],
                    },
                    child$(this.state.appState.codeEdition$, (code) => {
                        return code
                            ? new CodeEditorView({
                                  appState: this.state.appState,
                                  code,
                              })
                            : {}
                    }),
                ],
            },
            this.settingsView,
        ]

        const bodySettings = this.settingsView.attributesEditor.body

        this.state.load({
            canvas$: this.canvasView.htmlElement$,
            blocksPanel$: bodySettings.blocksPanel.htmlElement$,
            stylesPanel$: bodySettings.stylesPanel.htmlElement$,
            layersPanel$: bodySettings.layersPanel.htmlElement$,
        })
        this.connectedCallback = (elem: HTMLElement$) => {
            elem.ownSubscriptions(...this.state.subscriptions)
        }
    }
}

export class CanvasView implements VirtualDOM {
    public readonly id = 'gjs'
    public readonly class = 'flex-grow-1 px-2 pb-2'
    public readonly htmlElement$ = new ReplaySubject<
        HTMLElement$ & HTMLDivElement
    >(1)

    connectedCallback: (elem: HTMLElement$ & HTMLDivElement) => void

    constructor() {
        this.connectedCallback = (elem: HTMLElement$ & HTMLDivElement) => {
            this.htmlElement$.next(elem)
        }
    }
}

export class SettingsView implements VirtualDOM {
    public readonly class =
        'h-100 d-flex flex-column gjs-one-bg fv-border-left-background-alt'
    public readonly attributesEditor: AttributesEditor
    public readonly children: VirtualDOM[]

    constructor(params: { state: GrapesEditorState }) {
        this.attributesEditor = new AttributesEditor(params)
        this.children = [this.attributesEditor]
    }
}

export class DisplayModeToggle extends ToggleMenu<DisplayMode> {
    constructor(public readonly deviceMode$) {
        super({
            options: {
                edit: 'fa-border-none',
                preview: 'fa-eye',
            },
            buttonStyle: {
                ...styleToggleBase,
            },
            selector$: deviceMode$,
        })
    }
}

export class DeviceModeToggle extends ToggleMenu<DeviceMode> {
    constructor(public readonly deviceMode$) {
        super({
            options: {
                desktop: 'fa-desktop',
                tablet: 'fa-tablet-alt',
                'mobile-landscape': 'fa-mobile-alt',
                'mobile-portrait': 'fa-mobile-alt',
            },
            buttonStyle: {
                ...styleToggleBase,
            },
            selector$: deviceMode$,
        })
    }
}

export class OverallSettings implements VirtualDOM {
    public readonly class = 'd-flex justify-content-around'
    public readonly children: VirtualDOM[]

    constructor(params: { state: GrapesEditorState }) {
        this.children = [
            new DisplayModeToggle(params.state.displayMode$),
            new DeviceModeToggle(params.state.deviceMode$),
        ]
    }
}

export class AttributesEditor implements VirtualDOM {
    public readonly class = 'h-100 d-flex flex-column flex-grow-1'
    public readonly style = { minHeight: '0px' }
    public readonly editorMode$ = new BehaviorSubject<EditorMode>('blocks')
    public readonly header: AttributesEditorHeader
    public readonly body: AttributesEditorBody
    public readonly children: VirtualDOM[]
    public readonly state: GrapesEditorState

    constructor(params: { state: GrapesEditorState }) {
        Object.assign(this, params)
        this.header = new AttributesEditorHeader({
            editorMode$: this.editorMode$,
        })
        this.body = new AttributesEditorBody({
            editorMode$: this.editorMode$,
            state: this.state,
        })
        this.children = [this.header, this.body]
    }
}

export class EditorModeToggle extends ToggleMenu<EditorMode> {
    constructor(public readonly deviceMode$) {
        super({
            options: {
                blocks: 'fa-th-large',
                styles: 'fa-palette',
                layers: 'fa-bars',
                toolbox: 'fa-toolbox',
            },
            buttonStyle: {
                ...styleToggleBase,
                commonClassBase:
                    'fas fv-pointer flex-grow-1 rounded text-center py-1',
            },
            selector$: deviceMode$,
        })
    }
}

export class AttributesEditorHeader implements VirtualDOM {
    public readonly editorMode$: Subject<EditorMode>
    public readonly class = 'w-100'
    public readonly children: VirtualDOM[]

    constructor(params: { editorMode$: Subject<EditorMode> }) {
        Object.assign(this, params)
        this.children = [new EditorModeToggle(this.editorMode$)]
    }
}

export class AttributesEditorBody implements VirtualDOM {
    public readonly editorMode$: Subject<EditorMode>
    public readonly class =
        'overflow-auto border border-dark panels-container flex-grow-1'
    public readonly style = {
        height: 'calc(100% - 80px)',
    }
    public readonly children: AttributesPanel[]
    public readonly blocksPanel: AttributesPanel
    public readonly stylesPanel: AttributesPanel
    public readonly layersPanel: AttributesPanel
    public readonly state: GrapesEditorState

    constructor(params: {
        editorMode$: Subject<EditorMode>
        state: GrapesEditorState
    }) {
        Object.assign(this, params)

        const factory: Record<EditorMode, new (d) => AttributesPanel> = {
            blocks: AttributesPanel,
            styles: AttributesPanel,
            layers: AttributesPanel,
            toolbox: ToolboxesPanel,
        }
        this.children = Object.keys(factory).map(
            (mode: EditorMode) =>
                new factory[mode]({
                    state: this.state,
                    target: mode,
                    editorMode$: this.editorMode$,
                }),
        )
        ;[this.blocksPanel, this.stylesPanel, this.layersPanel] = this.children
    }
}
