import { child$, HTMLElement$, VirtualDOM } from '@youwol/flux-view'

import { DeviceMode, DisplayMode, GrapesEditorState } from './grapes.state'
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs'

import { styleToggleBase, ToggleMenu } from '../utils'
import * as grapesjs from 'grapesjs'
import { ToolboxesTab } from './toolboxes.view'
import * as Dockable from '../../common/dockable-tabs/dockable-tabs.view'

/**
 * @category View
 * @category Getting Started
 */
export class GrapesEditorView implements VirtualDOM {
    /**
     * @group States
     */
    public readonly state: GrapesEditorState

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 d-flex h-100'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    /**
     * @group Immutable DOM Constants
     */
    public readonly canvasView: CanvasView

    /**
     * @group Observables
     */
    public readonly editor$: Observable<grapesjs.Editor>

    /**
     * @group States
     */
    public readonly rightNavState: Dockable.State

    /**
     * @group Immutable DOM Constants
     */
    public readonly connectedCallback: (
        elem: HTMLElement$ & HTMLDivElement,
    ) => void

    constructor(params: { state: GrapesEditorState }) {
        Object.assign(this, params)

        this.canvasView = new CanvasView()

        let blocksTabView = new BlocksTab(params)
        let styleTabView = new StyleTab()
        let layersTabView = new LayersTab()
        let toolboxTab = new ToolboxesTab({ state: this.state })
        this.rightNavState = new Dockable.State({
            disposition: 'right',
            viewState$: new BehaviorSubject<Dockable.DisplayMode>('collapsed'),
            tabs$: new BehaviorSubject([
                blocksTabView,
                styleTabView,
                layersTabView,
                toolboxTab,
            ]),
            selected$: params.state.selectedTab$,
            persistTabsView: true,
        })

        this.children = [
            {
                class: 'd-flex flex-column w-100 h-100',
                children: [this.canvasView],
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

/**
 * @category View
 */
export class CanvasView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly id = 'gjs'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'flex-grow-1 p-2'

    /**
     * @group Observables
     */
    public readonly htmlElement$ = new ReplaySubject<
        HTMLElement$ & HTMLDivElement
    >(1)

    /**
     * @group Immutable DOM Constants
     */
    connectedCallback: (elem: HTMLElement$ & HTMLDivElement) => void

    constructor() {
        this.connectedCallback = (elem: HTMLElement$ & HTMLDivElement) => {
            this.htmlElement$.next(elem)
        }
    }
}

/**
 * @category View.Tab
 */
export class GrapesSettingsTab extends Dockable.Tab {
    /**
     * @group Observables
     */
    public readonly htmlElement$ = new ReplaySubject<
        HTMLElement$ & HTMLDivElement
    >(1)

    constructor(params: { id; title; icon; headerChild? }) {
        super({
            ...params,
            content: () => {
                return {
                    class: 'h-100 w-100 overflow-auto py-2',
                    children: [params.headerChild],
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

/**
 * @category View.Tab
 */
export class BlocksTab extends GrapesSettingsTab {
    constructor(params: { state: GrapesEditorState }) {
        super({
            id: 'blocks',
            title: 'Blocks',
            icon: 'fas fa-th-large',
            headerChild: child$(params.state.appState.plugins$, (plugins) => {
                return plugins.length > 0 ? {} : new BlocksHintView(params)
            }),
        })
    }
}

class BlocksHintView implements VirtualDOM {
    public readonly class = ' text-justify my-1 px-2'
    public readonly children: VirtualDOM[]

    constructor(params: { state: GrapesEditorState }) {
        this.children = [
            {
                tag: 'i',
                innerText:
                    'No plugins activated, you can activate them through the tab',
                children: [
                    {
                        tag: 'span',
                        class: 'fv-pointer fv-bg-background-alt rounded border fv-hover-xx-lighter mx-1 px-1',
                        innerText: 'Plugins',
                        onclick: () => {
                            params.state.selectedTab$.next('plugins')
                        },
                    },
                ],
            },
        ]
    }
}
/**
 * @category View.Tab
 */
export class StyleTab extends GrapesSettingsTab {
    constructor() {
        super({
            id: 'attributes',
            title: 'Attributes',
            icon: 'fas fa-palette',
        })
    }
}
/**
 * @category View.Tab
 */
export class LayersTab extends GrapesSettingsTab {
    constructor() {
        super({
            id: 'layers',
            title: 'Layers',
            icon: 'fas fa-bars',
        })
    }
}
/**
 * @category View
 */
export class OverallSettings implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'd-flex justify-content-around'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(params: { state: GrapesEditorState }) {
        this.children = [
            new DisplayModeToggle(params.state.displayMode$),
            { class: 'mx-3' },
            new DeviceModeToggle(params.state.deviceMode$),
        ]
    }
}
/**
 * @category View
 */
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
/**
 * @category View
 */
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
