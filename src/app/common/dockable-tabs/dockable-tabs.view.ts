import {
    attr$,
    child$,
    children$,
    Stream$,
    VirtualDOM,
} from '@youwol/flux-view'
import { BehaviorSubject, combineLatest, Subject } from 'rxjs'

export type Disposition = 'left' | 'bottom' | 'right'
export type DisplayMode = 'pined' | 'expanded' | 'collapsed'

export class Tab {
    public readonly id: string
    public readonly title: string
    public readonly icon: string
    public readonly content: () => VirtualDOM

    constructor(params: {
        id: string
        title: string
        icon: string
        content: () => VirtualDOM
    }) {
        Object.assign(this, params)
    }
}

export class State {
    public readonly disposition: Disposition
    public readonly viewState$: BehaviorSubject<DisplayMode>
    public readonly tabs$: BehaviorSubject<Tab[]>
    public readonly selected$: Subject<string>

    constructor(params: {
        disposition: Disposition
        viewState$: BehaviorSubject<DisplayMode>
        tabs$: BehaviorSubject<Tab[]>
        selected$: Subject<string>
    }) {
        Object.assign(this, params)
    }
}

const baseStyle = (disposition: Disposition) => {
    if (disposition == 'bottom') {
        return {
            height: '50%',
            opacity: '1',
        }
    }
    if (disposition == 'left' || 'right') {
        return {
            width: '300px',
            opacity: '1',
        }
    }
}

const styleFactory = (
    disposition: Disposition,
): Record<DisplayMode, { [k: string]: string }> => {
    const base = baseStyle(disposition)
    const pined = {
        ...base,
        position: 'static',
    }
    const expandedBase = {
        ...base,
        opacity: '0.95',
        zIndex: '10',
        position: 'absolute',
        // bottom: '0px',
        // left: '0px',
    }
    const expandedVariable: Record<Disposition, { [k: string]: string }> = {
        bottom: {
            bottom: '0px',
            left: '0px',
        },
        left: {
            top: '0px',
            left: '0px',
        },
        right: {
            top: '0px',
            right: '0px',
        },
    }

    const collapsedBase = {
        position: 'static',
    }
    const collapsedVariable: Record<Disposition, { [k: string]: string }> = {
        bottom: {
            height: 'fit-content',
        },
        left: {
            width: 'fit-content',
        },
        right: {
            width: 'fit-content',
        },
    }
    return {
        pined,
        expanded: { ...expandedBase, ...expandedVariable[disposition] },
        collapsed: { ...collapsedBase, ...collapsedVariable[disposition] },
    }
}

export class View implements VirtualDOM {
    static baseClasses = 'fv-bg-background fv-border-top-background-alt d-flex'
    static classFactory: Record<Disposition, string> = {
        bottom: `w-100 flex-column ${View.baseClasses}`,
        left: `h-100 flex-row ${View.baseClasses}`,
        right: `h-100 flex-row ${View.baseClasses}`,
    }
    public readonly state: State
    public readonly class: string
    public readonly children: VirtualDOM[]

    public readonly onmouseenter = () => {
        if (this.state.viewState$.getValue() == 'collapsed') {
            this.state.viewState$.next('expanded')
        }
    }
    public readonly onmouseleave = () => {
        if (this.state.viewState$.getValue() == 'expanded')
            this.state.viewState$.next('collapsed')
    }
    public readonly style: Stream$<DisplayMode, { [k: string]: string }>

    constructor(params: { state: State }) {
        Object.assign(this, params)
        this.class = View.classFactory[this.state.disposition]
        this.children = [
            new HeaderView({ state: this.state }),
            new TabContent({ state: this.state }),
        ]
        this.style = attr$(this.state.viewState$, (state) => {
            return styleFactory[state]
        })
    }
}

export class TabContent implements VirtualDOM {
    public readonly state: State
    public readonly class: Stream$<DisplayMode, string>
    public readonly children: VirtualDOM[]
    public readonly style = {
        minHeight: '0px',
    }
    constructor(params: { state }) {
        Object.assign(this, params)
        this.class = attr$(this.state.viewState$, (viewState) => {
            return viewState == 'collapsed' ? 'd-none' : 'flex-grow-1'
        })
        this.children = [
            child$(
                combineLatest([
                    this.state.viewState$,
                    this.state.selected$,
                    this.state.tabs$,
                ]),
                ([viewState, selected, tabs]) => {
                    if (viewState == 'collapsed') return {}
                    const selectedTab = tabs.find((tab) => tab.id == selected)
                    if (!selectedTab) return {}
                    return selectedTab.content()
                },
            ),
        ]
    }
}

export class HeaderView implements VirtualDOM {
    static baseClasses = 'd-flex fv-border-bottom-background-alt'
    static classFactory: Record<Disposition, string> = {
        bottom: `w-100 flex-row ${HeaderView.baseClasses}`,
        left: `h-100 flex-column ${HeaderView.baseClasses}`,
        right: `h-100 flex-column ${HeaderView.baseClasses}`,
    }

    public readonly class: string
    public readonly state: State
    public readonly children //: VirtualDOM[]

    constructor(params: { state }) {
        Object.assign(this, params)
        this.class = HeaderView.classFactory[this.state.disposition]
        const baseClasses =
            'p-1 fas fa-thumbtack fv-pointer fv-hover-xx-darker mx-3'
        this.children = children$(this.state.tabs$, (tabs: Tab[]) => {
            return tabs
                .map((tab) => {
                    return new TabHeaderView({
                        ...tab,
                        selected$: this.state.selected$,
                    }) as VirtualDOM
                })
                .concat([
                    {
                        class: 'flex-grow-1',
                    },
                    {
                        class: attr$(this.state.viewState$, (state) => {
                            return state == 'pined'
                                ? `${baseClasses} fv-text-focus`
                                : baseClasses
                        }),
                        onclick: () => {
                            this.state.viewState$.getValue() == 'pined'
                                ? this.state.viewState$.next('expanded')
                                : this.state.viewState$.next('pined')
                        },
                    },
                ])
        })
    }
}

export class TabHeaderView implements VirtualDOM {
    public readonly class: Stream$<string, string>
    public readonly id: string
    public readonly title: string
    public readonly selected$: Subject<string>
    public readonly icon: string
    public readonly children: VirtualDOM[]

    public readonly onclick = () => {
        this.selected$.next(this.id)
    }
    constructor(params: {
        title: string
        icon: string
        selected$: Subject<string>
    }) {
        Object.assign(this, params)
        let baseClass =
            'd-flex align-items-center mx-1 fv-pointer fv-hover-bg-background-alt px-2'
        this.class = attr$(this.selected$, (selected) => {
            return this.id == selected
                ? `${baseClass} fv-border-bottom-focus`
                : baseClass
        })
        this.children = [
            {
                class: this.icon,
            },
            { class: 'ml-2', innerText: this.title },
        ]
    }
}
