import { attr$, child$, Stream$, VirtualDOM } from '@youwol/flux-view'
import { BehaviorSubject } from 'rxjs'
import { delay, filter } from 'rxjs/operators'

type State = 'pined' | 'floatExpanded' | 'floatCollapsed'

export class SideNavView implements VirtualDOM {
    public readonly class =
        'h-100 fv-bg-background fv-text-primary side-nav overflow-auto'
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

        const styleFactory: Record<State, { [k: string]: string }> = {
            pined: {
                paddingLeft: '5px',
                paddingRight: '5px',
                width: '250px',
                position: 'static',
                opacity: '1',
            },
            floatExpanded: {
                paddingLeft: '5px',
                paddingRight: '5px',
                opacity: '0.95',
                zIndex: '10',
                width: '250px',
                position: 'absolute',
                top: '0px',
                left: '0px',
            },
            floatCollapsed: {
                padding: '0px',
                width: '5px',
                position: 'absolute',
                top: '0px',
                left: '0px',
                overflow: 'hidden',
            },
        }
        this.style = attr$(this.state$, (state) => {
            return styleFactory[state]
        })
    }
}

export class SideBarHeaderView implements VirtualDOM {
    public readonly class = 'd-flex flex-row-reverse border-bottom'
    public readonly children: VirtualDOM[]

    public readonly state$: BehaviorSubject<State>

    constructor(params: { state$: BehaviorSubject<State> }) {
        Object.assign(this, params)
        const baseClasses = 'p-1 fas fa-thumbtack fv-pointer'
        this.children = [
            {
                class: attr$(this.state$, (state) => {
                    if (state == 'floatCollapsed') return 'd-none'
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
