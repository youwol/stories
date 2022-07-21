import { attr$, HTMLElement$, Stream$, VirtualDOM } from '@youwol/flux-view'
import { EditorMode, GrapesEditorState } from './grapes.state'
import { Observable, ReplaySubject, Subject } from 'rxjs'

/**
 * @category View
 */
export class AttributesPanel implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class: Stream$<EditorMode, string>
    /**
     * @group Observables
     */
    public readonly editorMode$: Observable<EditorMode>
    /**
     * @group Observables
     */
    public readonly target: EditorMode
    /**
     * @group Observables
     */
    public readonly htmlElement$ = new ReplaySubject<
        HTMLElement$ & HTMLDivElement
    >(1)

    /**
     * @group Immutable DOM Constants
     */
    public readonly connectedCallback = (
        elem: HTMLElement$ & HTMLDivElement,
    ) => {
        this.htmlElement$.next(elem)
    }
    /**
     * @group States
     */
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
