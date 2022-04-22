import { attr$, HTMLElement$, Stream$, VirtualDOM } from '@youwol/flux-view'
import { EditorMode, GrapesEditorState } from './grapes.state'
import { Observable, ReplaySubject, Subject } from 'rxjs'

export class AttributesPanel implements VirtualDOM {
    public readonly class: Stream$<EditorMode, string>
    public readonly editorMode$: Observable<EditorMode>
    public readonly target: EditorMode
    public readonly htmlElement$ = new ReplaySubject<
        HTMLElement$ & HTMLDivElement
    >(1)

    public readonly connectedCallback = (
        elem: HTMLElement$ & HTMLDivElement,
    ) => {
        this.htmlElement$.next(elem)
    }
    public readonly state: GrapesEditorState

    constructor(params: {
        target: EditorMode
        editorMode$: Subject<EditorMode>
        state: GrapesEditorState
    }) {
        Object.assign(this, params)
        this.class = attr$(this.editorMode$, (mode) => {
            return mode == this.target ? 'd-block' : 'd-none'
        })
    }
}
