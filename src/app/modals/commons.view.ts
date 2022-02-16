import { HTMLElement$, render, VirtualDOM } from '@youwol/flux-view'
import { Button } from '@youwol/fv-button'
import { Modal } from '@youwol/fv-group'
import { TextInput } from '@youwol/fv-input'
import { BehaviorSubject, merge, Subject } from 'rxjs'

export function okButtonView() {
    return new Button.View({
        state: new Button.State(),
        contentView: () => ({ innerText: 'Ok' }),
        class: 'fv-btn fv-btn-primary fv-bg-focus mr-2',
    } as any)
}

export function rowView(
    name: string,
    text$: BehaviorSubject<string>,
    id: string,
) {
    const state = new TextInput.State(text$)
    const view = new TextInput.View({ state, class: 'col' } as any)
    return {
        id,
        class: 'row my-4 ',
        children: [
            {
                tag: 'span',
                class: 'col',
                innerText: name,
            },
            view,
        ],
    }
}

export function simpleModal({
    rows,
    ok$,
}: {
    rows: VirtualDOM[]
    ok$: Subject<MouseEvent>
}) {
    const okBttn = okButtonView()
    const modalState = new Modal.State(ok$)

    const modalDiv = render(
        new Modal.View({
            state: modalState,
            contentView: () => {
                return {
                    id: 'modal-select-module',
                    class: 'border rounded fv-text-primary fv-bg-background d-flex flex-column p-5',
                    children: [
                        {
                            children: rows,
                        },
                        {
                            class: 'd-flex p-2',
                            children: [okBttn],
                        },
                    ],
                }
            },
            connectedCallback: (elem: HTMLElement$ & HTMLDivElement) => {
                elem.ownSubscriptions(
                    okBttn.state.click$.subscribe(() => modalState.ok$.next()),
                    merge(modalState.cancel$, modalState.ok$).subscribe(() =>
                        modalDiv.remove(),
                    ),
                )
            },
        } as any),
    )
    document.querySelector('body').appendChild(modalDiv)
    return modalState
}

export function modalView(selection$, contentView: VirtualDOM) {
    const modalState = new Modal.State()
    const view = new Modal.View({
        state: modalState,
        contentView: () => {
            return {
                class: 'p-3 rounded fv-color-primary fv-bg-background w-50',
                style: { minWidth: '50%' },
                children: [contentView],
            }
        },
        connectedCallback: (elem: HTMLDivElement & HTMLElement$) => {
            elem.children[0].classList.add('w-100')
            // https://stackoverflow.com/questions/63719149/merge-deprecation-warning-confusion
            const sub = merge(
                ...[modalState.cancel$, modalState.ok$, selection$],
            ).subscribe(() => {
                modalDiv.remove()
            })
            elem.ownSubscriptions(sub)
        },
    } as any)
    const modalDiv = render(view)
    document.querySelector('body').appendChild(modalDiv)
    return view
}
