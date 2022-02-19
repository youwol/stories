import { attr$, HTMLElement$, Stream$, VirtualDOM } from '@youwol/flux-view'

import {
    DeviceMode,
    DisplayMode,
    EditorMode,
    GrapesEditorState,
} from './grapes.state'
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs'

import { styleToggleBase, ToggleMenu } from '../utils/utils.view'
import * as grapesjs from 'grapesjs'
import { resizablePanel } from '@youwol/fv-group'

export class GrapesEditorView implements VirtualDOM {
    public readonly state: GrapesEditorState
    public readonly class = 'w-100 d-flex'
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
            this.canvasView,
            resizablePanel(this.settingsView, 'Toolboxes', 'right', {
                minWidth: 195,
            }),
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
    public readonly class = 'flex-grow-1 p-2 fv-border-primary'
    public htmlElement$ = new ReplaySubject<HTMLElement$ & HTMLDivElement>(1)

    connectedCallback: (elem: HTMLElement$ & HTMLDivElement) => void

    constructor() {
        this.connectedCallback = (elem: HTMLElement$ & HTMLDivElement) => {
            this.htmlElement$.next(elem)
        }
    }
}

export class SettingsView implements VirtualDOM {
    public readonly class = 'flex-grow-1 gjs-one-bg fv-color-primary'
    public readonly overallSettings: OverallSettings
    public readonly attributesEditor: AttributesEditor
    public readonly children: VirtualDOM[]

    constructor(params: { state: GrapesEditorState }) {
        this.overallSettings = new OverallSettings(params)
        this.attributesEditor = new AttributesEditor()
        this.children = [
            this.overallSettings,
            { class: 'mb-1 mx-2 border-top' },
            this.attributesEditor,
        ]
    }
}

const styleToggle0 = {
    commonClassBase: 'fas fv-pointer p-1 rounded',
    activeClass: 'fv-text-focus  fv-bg-background',
    inactiveClass:
        'fv-text-primary  fv-hover-text-focus fv-bg-background-alt fv-hover-xx-darker ',
}

const styleToggle1 = {
    ...styleToggle0,
    commonClassBase: 'fas fv-pointer flex-grow-1 rounded text-center py-1',
}

export class DisplayModeToggle implements VirtualDOM {
    class = 'd-flex'

    children: ToggleButton<DisplayMode>[]

    constructor(public readonly displayMode$) {
        this.children = [
            new ToggleButton({
                selector$: this.displayMode$,
                targetValue: 'edit',
                commonClassSpecific: 'fa-border-none',
                ...styleToggle0,
            }),
            new ToggleButton({
                selector$: this.displayMode$,
                targetValue: 'preview',
                commonClassSpecific: 'fa-eye',
                ...styleToggle0,
            }),
        ]
    }
}

export class DeviceModeToggle implements VirtualDOM {
    class = 'd-flex'

    children: ToggleButton<DeviceMode>[]

    constructor(public readonly deviceMode$) {
        this.children = [
            new ToggleButton({
                selector$: this.deviceMode$,
                targetValue: 'desktop',
                commonClassSpecific: 'fa-desktop',
                ...styleToggle0,
            }),
            new ToggleButton({
                selector$: this.deviceMode$,
                targetValue: 'tablet',
                commonClassSpecific: 'fa-tablet-alt',
                ...styleToggle0,
            }),
            new ToggleButton({
                selector$: this.deviceMode$,
                targetValue: 'mobile-landscape',
                commonClassSpecific: 'fa-mobile-alt',
                ...styleToggle0,
            }),
            new ToggleButton({
                selector$: this.deviceMode$,
                targetValue: 'mobile-portrait',
                commonClassSpecific: 'fa-mobile-alt',
                ...styleToggle0,
            }),
        ]
    }
}

export class OverallSettings implements VirtualDOM {
    public readonly class = 'd-flex justify-content-between p-1'
    public readonly children: VirtualDOM[]

    constructor(params: { state: GrapesEditorState }) {
        this.children = [
            new DisplayModeToggle(params.state.displayMode$),
            new DeviceModeToggle(params.state.deviceMode$),
        ]
    }
}

export class AttributesEditor implements VirtualDOM {
    public readonly editorMode$ = new BehaviorSubject<EditorMode>('blocks')
    public readonly header: AttributesEditorHeader
    public readonly body: AttributesEditorBody
    public readonly children: VirtualDOM[]

    constructor() {
        this.header = new AttributesEditorHeader({
            editorMode$: this.editorMode$,
        })
        this.body = new AttributesEditorBody({ editorMode$: this.editorMode$ })
        this.children = [this.header, this.body]
    }
}

export class EditorModeToggle implements VirtualDOM {
    class = 'd-flex w-100'
    children: ToggleButton<EditorMode>[]

    constructor(public readonly editorMode$) {
        this.children = [
            new ToggleButton({
                selector$: this.editorMode$,
                targetValue: 'blocks',
                commonClassSpecific: 'fa-th-large',
                ...styleToggle1,
            }),
            new ToggleButton({
                selector$: this.editorMode$,
                targetValue: 'styles',
                commonClassSpecific: 'fa-palette',
                ...styleToggle1,
            }),
            new ToggleButton({
                selector$: this.editorMode$,
                targetValue: 'layers',
                commonClassSpecific: 'fa-bars',
                ...styleToggle1,
            }),
        ]
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

export class AttributesPanel implements VirtualDOM {
    public readonly class: Stream$<EditorMode, string>
    public readonly editorMode$: Observable<EditorMode>
    public readonly target: EditorMode
    public readonly htmlElement$ = new ReplaySubject<
        HTMLElement$ & HTMLDivElement
    >(1)

    public readonly connectedCallback = (
        elem: HTMLElement$ & HTMLDivElement,
    ) => {
        this.htmlElement$.next(elem)
    }

    constructor(params: {
        target: EditorMode
        editorMode$: Subject<EditorMode>
    }) {
        Object.assign(this, params)
        this.class = attr$(this.editorMode$, (mode) => {
            return mode == this.target ? 'd-block' : 'd-none'
        })
    }
}

export class AttributesEditorBody implements VirtualDOM {
    public readonly editorMode$: Subject<EditorMode>
    public readonly class = 'overflow-auto border border-dark panels-container'
    public readonly style = {
        height: 'calc(100% - 80px)',
    }
    public readonly children: AttributesPanel[]
    public readonly blocksPanel: AttributesPanel
    public readonly stylesPanel: AttributesPanel
    public readonly layersPanel: AttributesPanel

    constructor(params: { editorMode$: Subject<EditorMode> }) {
        Object.assign(this, params)

        this.children = ['blocks', 'styles', 'layers'].map(
            (mode: EditorMode) =>
                new AttributesPanel({
                    target: mode,
                    editorMode$: this.editorMode$,
                }),
        )
        ;[this.blocksPanel, this.stylesPanel, this.layersPanel] = this.children
    }
}
