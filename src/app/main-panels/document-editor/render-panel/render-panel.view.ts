import { HTMLElement$, VirtualDOM } from "@youwol/flux-view";
import { Observable } from "rxjs";
import { AppState } from "../../../app-state";

import { DocumentNode, Node } from "../../../explorer/nodes"


export class RenderState {

    node: Node
    constructor({ node }: {
        node: Node
    }) {
        this.node = node
    }
}


export class RenderView implements VirtualDOM {

    public readonly class = 'd-flex flex-column flex-grow-1 fv-bg-background-alt w-50 ml-1 p-2'
    public readonly children: Array<VirtualDOM>
    public readonly content$: Observable<string>
    public readonly node: DocumentNode
    public readonly appState: AppState

    constructor(params: {
        node: Node,
        appState: AppState,
        content$: Observable<string>
    }) {
        Object.assign(this, params)
        this.children = [
            {
                class: 'w-100',
                connectedCallback: (htmlElement: HTMLElement$) => {
                    
                    let sub = this.content$.subscribe( content => {
                        htmlElement.innerHTML = window['marked'](content);
                        window['MathJax']
                        .typesetPromise([htmlElement])
                        .then(()=> {})
                    })
                    htmlElement.ownSubscriptions(sub)
                }
            }
        ]
    }
}