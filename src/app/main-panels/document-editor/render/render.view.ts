import { HTMLElement$, VirtualDOM } from "@youwol/flux-view";
import { merge, Observable, ReplaySubject } from "rxjs";
import { debounceTime, skip, take } from "rxjs/operators";
import { AppState } from "../../../main-app/app-state";
import { DocumentNode, ExplorerNode } from "../../../explorer/nodes"
import { MarkDownRenderer, MathJaxRenderer, RenderableTrait, YouwolRenderer } from "./renderers";


/**
 *Logic side of [[RenderView]]
 */
 export class RenderState implements VirtualDOM {

    public readonly content$: Observable<string>
    public readonly node: DocumentNode
    public readonly appState: AppState
    public readonly renderedElement$ = new ReplaySubject<HTMLElement>(1)

    public documentScope = {}

    public readonly renderers = [
        new MarkDownRenderer(),
        new MathJaxRenderer(),
        new YouwolRenderer()
    ]

    constructor(params: {
        node: ExplorerNode,
        appState: AppState,
        content$: Observable<string>
    }) {
        Object.assign(this, params)
    }

    async render(htmlElement: HTMLElement){

        await this.renderers.reduce(
            async (accHtmlElement: Promise<HTMLElement>, renderer: RenderableTrait) => {
                return renderer.render( await accHtmlElement, this.documentScope )
            },
            Promise.resolve(htmlElement)
        )
        this.renderedElement$.next(htmlElement)
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
                        htmlElement.innerHTML = content 
                        this.renderState.render(htmlElement)
                    })
                    htmlElement.ownSubscriptions(sub)
                }
            }
        ]
    }
}