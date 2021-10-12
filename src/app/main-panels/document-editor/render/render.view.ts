import { HTMLElement$, VirtualDOM } from "@youwol/flux-view";
import { merge, Observable, ReplaySubject, Subject } from "rxjs";
import { debounceTime, skip, take } from "rxjs/operators";
import { AppState } from "../../../main-app/app-state";
import { DocumentNode, ExplorerNode } from "../../../explorer/nodes"

/**
 *Logic side of [[RenderView]]
 */
 export class RenderState implements VirtualDOM {

    public readonly content$: Observable<string>
    public readonly node: DocumentNode
    public readonly appState: AppState
    public readonly renderedElement$ = new ReplaySubject<HTMLElement>(1)
    /**
     * see https://docs.mathjax.org/en/latest/web/typeset.html
     */ 
    private promise : any = Promise.resolve()

    constructor(params: {
        node: ExplorerNode,
        appState: AppState,
        content$: Observable<string>
    }) {
        Object.assign(this, params)
    }

    renderMarkdown(htmlElement: HTMLElement, content: string){
        htmlElement.innerHTML = window['marked'](content);
    }
    
    renderMathJax(htmlElement: HTMLElement){
        this.promise = this.promise
        .then( () =>{
            window['MathJax'].typesetPromise([htmlElement])
            this.renderedElement$.next(htmlElement)
        })
    }
}

/**
 * Render view
 */
export class RenderView implements VirtualDOM {

    public readonly id = "render-view"
    public readonly class : string
    public readonly children: Array<VirtualDOM>

    public readonly renderState: RenderState
    constructor(params: {
        renderState: RenderState
        class
    }) {
        Object.assign(this, params)
        this.children = [
            {
                class: 'w-100',
                connectedCallback: (htmlElement: HTMLElement$) => {
                    
                    let sub = merge(
                        this.renderState.content$.pipe( take(1)) ,
                        this.renderState.content$.pipe( skip(1), debounceTime(500))
                    ).subscribe( (content) => {
                        this.renderState.renderMarkdown(htmlElement, content)
                        this.renderState.renderMathJax(htmlElement)
                    })
                    htmlElement.ownSubscriptions(sub)
                }
            }
        ]
    }
}