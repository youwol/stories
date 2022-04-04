import { child$, HTMLElement$, VirtualDOM } from '@youwol/flux-view'

import { DeviceMode, DisplayMode, GrapesEditorState } from './grapes.state'
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs'

import { styleToggleBase, ToggleMenu } from '../utils/utils.view'
import * as grapesjs from 'grapesjs'
import { ToolboxesTab } from './toolboxes.view'
import { CodeEditorView } from '../code-editor/code-editor.view'
import * as Dockable from '../../common/dockable-tabs/dockable-tabs.view'

export class GrapesEditorView implements VirtualDOM {
    public readonly state: GrapesEditorState
    public readonly class = 'w-100 d-flex h-100'
    public readonly children: VirtualDOM[]
    public readonly canvasView: CanvasView
    public readonly editor$: Observable<grapesjs.Editor>
    public readonly rightNavState: Dockable.State

    public readonly connectedCallback: (
        elem: HTMLElement$ & HTMLDivElement,
    ) => void

    constructor(params: { state: GrapesEditorState }) {
        Object.assign(this, params)

        this.canvasView = new CanvasView()

        let blocksTabView = new BlocksTab()
        let styleTabView = new StyleTab()
        let layersTabView = new LayersTab()
        let toolboxTab = new ToolboxesTab({ state: this.state })
        this.rightNavState = new Dockable.State({
            disposition: 'right',
            viewState$: new BehaviorSubject<Dockable.DisplayMode>('pined'),
            tabs$: new BehaviorSubject([
                blocksTabView,
                styleTabView,
                layersTabView,
                toolboxTab,
            ]),
            selected$: new BehaviorSubject<string>('blocks'),
            persistTabsView: true,
        })

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
            new Dockable.View({
                state: this.rightNavState,
                styleOptions: { initialPanelSize: '300px' },
            }),
        ]

        this.state.load({
            canvas$: this.canvasView.htmlElement$,
            blocksPanel$: blocksTabView.htmlElement$,
            stylesPanel$: styleTabView.htmlElement$,
            layersPanel$: layersTabView.htmlElement$,
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

export class GrapesSettingsTab extends Dockable.Tab {
    public readonly htmlElement$ = new ReplaySubject<
        HTMLElement$ & HTMLDivElement
    >(1)

    constructor(params: { id; title; icon }) {
        super({
            ...params,
            content: () => {
                return {
                    class: 'h-100 w-100 overflow-auto',
                    connectedCallback: (
                        elem: HTMLElement$ & HTMLDivElement,
                    ) => {
                        this.htmlElement$.next(elem)
                    },
                }
            },
        })
    }
}
export class BlocksTab extends GrapesSettingsTab {
    constructor() {
        super({
            id: 'blocks',
            title: 'Blocks',
            icon: 'fas fa-th-large',
        })
    }
}

export class StyleTab extends GrapesSettingsTab {
    constructor() {
        super({
            id: 'attributes',
            title: 'Attributes',
            icon: 'fas fa-palette',
        })
    }
}

export class LayersTab extends GrapesSettingsTab {
    constructor() {
        super({
            id: 'layers',
            title: 'Layers',
            icon: 'fas fa-bars',
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
