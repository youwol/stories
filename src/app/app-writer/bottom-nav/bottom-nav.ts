import {
    attr$,
    child$,
    Stream$,
    VirtualDOM,
    children$,
} from '@youwol/flux-view'
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs'

export type BottomNavViewState = 'pined' | 'expanded' | 'collapsed'

export class BottomNavTab {
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

export class BottomNavState {
    public readonly viewState$: BehaviorSubject<BottomNavViewState>
    public readonly tabs$: Observable<BottomNavTab[]>
    public readonly selected$: Subject<string>

    constructor(params: {
        viewState$: BehaviorSubject<BottomNavViewState>
        tabs$: Observable<BottomNavTab[]>
        selected$: Subject<string>
    }) {
        Object.assign(this, params)
    }
}

const baseStyle = {
    height: '50%',
    opacity: '1',
}
const styleFactory: Record<BottomNavViewState, { [k: string]: string }> = {
    pined: {
        ...baseStyle,
        position: 'static',
    },
    expanded: {
        ...baseStyle,
        opacity: '0.95',
        zIndex: '10',
        position: 'absolute',
        bottom: '0px',
        left: '0px',
    },
    collapsed: {
        position: 'static',
        height: 'fit-content',
    },
}

export class BottomNav implements VirtualDOM {
    public readonly state: BottomNavState
    public readonly class =
        'w-100 fv-bg-background fv-border-top-background-alt'
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
    public readonly style: Stream$<BottomNavViewState, { [k: string]: string }>

    constructor(params: { state: BottomNavState }) {
        Object.assign(this, params)

        this.children = [
            new BottomNavHeader({ state: this.state }),
            new BottomNavContent({ state: this.state }),
        ]
        this.style = attr$(this.state.viewState$, (state) => {
            return styleFactory[state]
        })
    }
}

export class BottomNavContent implements VirtualDOM {
    public readonly state: BottomNavState
    public readonly class: Stream$<BottomNavViewState, string>
    public readonly children: VirtualDOM[]

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

export class BottomNavHeader implements VirtualDOM {
    public readonly class = 'w-100 d-flex fv-border-bottom-background-alt'
    public readonly state: BottomNavState
    public readonly children //: VirtualDOM[]

    constructor(params: { state }) {
        Object.assign(this, params)
        const baseClasses =
            'p-1 fas fa-thumbtack fv-pointer fv-hover-xx-darker mx-3'
        this.children = children$(this.state.tabs$, (tabs: BottomNavTab[]) => {
            return tabs
                .map((tab) => {
                    return new BottomNavHeaderItem({
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

export class BottomNavHeaderItem implements VirtualDOM {
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
