import { child$, VirtualDOM } from "@youwol/flux-view";
import { AppState } from "../../main-app/app-state";
import { EditorView } from "./editor/editor.view";
import { RenderView } from "./render/render.view";
import { distinctUntilChanged, map } from "rxjs/operators";

/**
 * Document editors view, encapsulates [[EditorView]] and [[RenderView]]
 */
export class DocumentEditorView implements VirtualDOM {

    public readonly class = "d-flex flex-grow-1"
    public readonly children: VirtualDOM[]
    public readonly appState: AppState
    public readonly style = { minWidth: '0px' }
    public readonly innerClass = 'd-flex flex-column fv-bg-background w-50 h-100 mr-1 ml-2 p-2 overflow-auto'

    constructor(params: {
        appState: AppState
    }) {
        Object.assign(this, params)
        let document$ = this.appState.page$.pipe(
            map(({ document }) => document),
            distinctUntilChanged()
        )

        this.children = [
            child$(
                document$,
                (document) =>
                    new EditorView({ document, appState: this.appState, class: this.innerClass }),
            ),
            child$(
                document$,
                (document) =>
                    new RenderView({ document, appState: this.appState, class: this.innerClass }),
            )
        ]
    }
}
