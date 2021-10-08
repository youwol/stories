import { VirtualDOM } from "@youwol/flux-view";
import { ReplaySubject } from "rxjs";
import { AppState } from "../../app-state";
import { DocumentNode } from "../../explorer/nodes";
import { EditorView } from "./editor/editor.view";
import { RenderView } from "./render-panel/render-panel.view";


export class DocumentEditorView implements VirtualDOM{

    public readonly class = "d-flex w-100"
    public readonly children : VirtualDOM[]    
    public readonly node: DocumentNode
    public readonly appState: AppState
    public readonly content$ = new ReplaySubject<string>(1)
    
    constructor(params: {
        node: DocumentNode,
        appState: AppState
    }){
        Object.assign(this, params)
        this.children = [
            new EditorView({node:this.node, appState: this.appState, content$: this.content$}),
            new RenderView({node:this.node, appState: this.appState, content$: this.content$}),
        ]
    }
}