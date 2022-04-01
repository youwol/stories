import { attr$, child$, Stream$, VirtualDOM } from '@youwol/flux-view'
import { BehaviorSubject } from 'rxjs'
import { delay, filter } from 'rxjs/operators'

type State = 'pined' | 'floatExpanded' | 'floatCollapsed'
const baseStyle = {
    paddingLeft: '10px',
    paddingRight: '10px',
    width: '250px',
    minWidth: '250px',
    maxWidth: '250px',
    opacity: '1',
}
const styleFactory: Record<State, { [k: string]: string }> = {
    pined: {
        ...baseStyle,
        position: 'static',
    },
    floatExpanded: {
        ...baseStyle,
        opacity: '0.95',
        zIndex: '10',
        position: 'absolute',
        top: '0px',
        left: '0px',
    },
    floatCollapsed: {
        padding: '0px',
        width: '5px',
        minWidth: '5px',
        maxWidth: '5px',
        position: 'absolute',
        top: '0px',
        left: '0px',
        overflow: 'hidden',
    },
}

export class SideNavView implements VirtualDOM {
    public readonly class =
        'h-100 fv-bg-background fv-xx-lighter fv-text-primary side-nav overflow-auto'
    public readonly style: Stream$<State, { [k: string]: string }>
    public readonly state$ = new BehaviorSubject<State>('pined')
    public readonly children: VirtualDOM[]

    public readonly onmouseenter = () => {
        if (this.state$.getValue() == 'floatCollapsed')
            this.state$.next('floatExpanded')
    }
    public readonly onmouseleave = () => {
        if (this.state$.getValue() == 'floatExpanded')
            this.state$.next('floatCollapsed')
    }
    connectedCallback = (elem: HTMLDivElement) => {
        elem.style.transition = 'width 0.1s ease'
        this.state$
            .pipe(
                filter((state) => state == 'floatCollapsed'),
                delay(100),
            )
            .subscribe(() => {
                elem.style.position = 'static'
            })
    }
    constructor(params: { content: VirtualDOM }) {
        this.children = [
            new SideBarHeaderView({ state$: this.state$ }),
            child$(this.state$, (state) =>
                state == 'floatCollapsed' ? {} : params.content,
            ),
        ]

        this.style = attr$(this.state$, (state) => {
            return styleFactory[state]
        })
    }
}

export class SideBarHeaderView implements VirtualDOM {
    public readonly class
    public readonly children: VirtualDOM[]
    public readonly state$: BehaviorSubject<State>

    constructor(params: { state$: BehaviorSubject<State> }) {
        Object.assign(this, params)
        this.class = attr$(this.state$, (state) =>
            state == 'floatCollapsed'
                ? 'd-none'
                : 'd-flex fv-border-bottom-background-alt mb-3',
        )
        const baseClasses = 'p-1 fas fa-thumbtack fv-pointer fv-hover-xx-darker'
        this.children = [
            {
                class: 'd-flex align-items-center fv-xx-darker',
                children: [
                    {
                        class: 'fas fa-sitemap pr-1',
                    },
                    {
                        innerText: 'structure',
                    },
                ],
            },
            {
                class: 'flex-grow-1',
            },
            {
                class: attr$(this.state$, (state) => {
                    return state == 'pined'
                        ? `${baseClasses} fv-text-focus`
                        : baseClasses
                }),
                onclick: () => {
                    this.state$.getValue() == 'pined'
                        ? this.state$.next('floatExpanded')
                        : this.state$.next('pined')
                },
            },
        ]
    }
}
