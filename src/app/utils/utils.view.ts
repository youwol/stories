import { attr$, Stream$, VirtualDOM } from '@youwol/flux-view'
import { Subject } from 'rxjs'

export interface ButtonStyle {
    commonClassBase: string
    commonClassSpecific: string
    activeClass: string
    inactiveClass: string
}

export class ToggleButton<T> implements VirtualDOM {
    public readonly class: Stream$<T, string>
    public readonly onclick: (ev: MouseEvent) => void

    constructor({
        selector$,
        targetValue,
        commonClassBase,
        commonClassSpecific,
        activeClass,
        inactiveClass,
    }: {
        selector$: Subject<T>
        targetValue: T
        commonClassBase: string
        commonClassSpecific: string
        activeClass: string
        inactiveClass: string
    }) {
        this.onclick = () => selector$.next(targetValue)
        this.class = attr$(
            selector$,
            (mode: T) => {
                return mode == targetValue ? activeClass : inactiveClass
            },
            {
                wrapper: (d) =>
                    `${d} ${commonClassBase} ${commonClassSpecific}`,
            },
        )
    }
}

export class ToggleMenu<T> implements VirtualDOM {
    public readonly class = 'd-flex'
    public readonly options: T[]
    public readonly children: ToggleButton<T>[]
    public readonly buttonStyle: ButtonStyle
    public readonly selector$: Subject<T>

    constructor(params: {
        options: T[]
        selector$: Subject<T>
        buttonStyle: ButtonStyle
        [_key: string]: unknown
    }) {
        Object.assign(this, params)
        this.children = this.options.map((option) => {
            return new ToggleButton({
                selector$: this.selector$,
                targetValue: option,
                commonClassSpecific: 'fa-desktop',
                ...this.buttonStyle,
            })
        })
    }
}
