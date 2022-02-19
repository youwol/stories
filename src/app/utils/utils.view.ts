import { attr$, Stream$, VirtualDOM } from '@youwol/flux-view'
import { Subject } from 'rxjs'

type ToggleMode = string | number | symbol

export const styleToggleBase = {
    commonClassBase: 'fas fv-pointer p-1 rounded',
    activeClass: 'fv-text-focus  fv-bg-background',
    inactiveClass:
        'fv-text-primary  fv-hover-text-focus fv-bg-background-alt fv-hover-xx-darker ',
}

export interface ButtonStyle {
    commonClassBase: string
    activeClass: string
    inactiveClass: string
}

export class ToggleButton<T extends ToggleMode> implements VirtualDOM {
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

export class ToggleMenu<T extends ToggleMode> implements VirtualDOM {
    public readonly class = 'd-flex'
    public readonly options: Record<T, string>
    public readonly children: ToggleButton<T>[]
    public readonly buttonStyle: ButtonStyle
    public readonly selector$: Subject<T>

    constructor(params: {
        options: Record<T, string>
        selector$: Subject<T>
        buttonStyle: ButtonStyle
        [_key: string]: unknown
    }) {
        Object.assign(this, params)
        this.children = (
            Object.entries(this.options) as Array<[T, string]>
        ).map(([option, classes]: [T, string]) => {
            return new ToggleButton({
                selector$: this.selector$,
                targetValue: option,
                ...this.buttonStyle,
                commonClassSpecific: classes,
            })
        })
    }
}
