import { VirtualDOM } from "@youwol/flux-view";
import { ReplaySubject } from "rxjs";
import { AppState } from "../../main-app/app-state";
import { DocumentNode } from "../../explorer/nodes";
import { EditorState, EditorView } from "./editor/editor.view";
import { RenderState, RenderView } from "./render/render.view";

/**
 * Document editors view, encapsulates [[EditorView]] and [[RenderView]]
 */
export class DocumentEditorView implements VirtualDOM{

    public readonly class = "d-flex"
    public readonly children : VirtualDOM[]    
    public readonly node: DocumentNode
    public readonly appState: AppState
    public readonly content$ = new ReplaySubject<string>(1)
    
    public readonly innerClass = 'd-flex flex-column fv-bg-background w-50 h-100 mr-1 ml-2 p-2 overflow-auto'

    constructor(params: {
        node: DocumentNode,
        appState: AppState
    }){
        Object.assign(this, params)
        let editorState = new EditorState({node:this.node, appState: this.appState, content$: this.content$})
        let renderState = new RenderState({node:this.node, appState: this.appState, content$: this.content$})

        this.children = [
            new EditorView({editorState, class: this.innerClass}),
            new RenderView({renderState, class: this.innerClass}),
        ]
    }
}