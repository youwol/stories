import { merge } from 'rxjs'
import { Modal } from '@youwol/fv-group'
import { HTMLElement$, render, VirtualDOM } from '@youwol/flux-view'

export function popupModal({ editorView }: { editorView: VirtualDOM }) {
    const modalState = new Modal.State()
    const view = new Modal.View({
        state: modalState,
        contentView: () => {
            return {
                class: 'p-3 rounded fv-color-primary fv-bg-background w-75 h-75 overflow-auto',
                children: [editorView],
            }
        },
        connectedCallback: (elem: HTMLDivElement & HTMLElement$) => {
            elem.children[0].classList.add('w-100')
            const sub = merge(modalState.cancel$, modalState.ok$).subscribe(
                () => {
                    modalDiv.remove()
                },
            )
            elem.ownSubscriptions(sub)
        },
    } as any)
    const modalDiv = render(view)
    document.querySelector('body').appendChild(modalDiv)
}
