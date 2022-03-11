import { CodeEditorState } from '../../../code-editor/code-editor.view'
import { combineLatest, Subject } from 'rxjs'
import { HTMLElement$, VirtualDOM } from '@youwol/flux-view'
import { popupEmojisBrowserModal } from '../../../modals/emojis-picker.view'

export class MarkDownHeaderView {
    public readonly state: CodeEditorState
    public readonly emojis$ = new Subject<string>()
    public readonly children: VirtualDOM[]
    public readonly connectedCallback: (
        elem: HTMLElement$ & HTMLDivElement,
    ) => void

    constructor(params: { state: CodeEditorState }) {
        Object.assign(this, params)
        this.children = [
            {
                class: 'd-flex w-100 align-items-center',
                children: [
                    {
                        tag: 'i',
                        class: 'fv-pointer rounded m-1 fas fa-smile editor-view-header-emoji',
                        onclick: () => popupEmojisBrowserModal(this.emojis$),
                    },
                ],
            },
        ]
        this.connectedCallback = (elem: HTMLElement$ & HTMLDivElement) => {
            elem.ownSubscriptions(
                combineLatest([
                    this.state.codeMirrorEditor$,
                    this.emojis$,
                ]).subscribe(([cm, emoji]) => {
                    const doc = cm.getDoc()
                    const cursor = doc.getCursor()
                    doc.replaceRange(emoji, cursor)
                }),
            )
        }
    }
}
