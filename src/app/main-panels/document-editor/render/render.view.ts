import { HTMLElement$, VirtualDOM } from "@youwol/flux-view";
import { merge, ReplaySubject } from "rxjs";
import { debounceTime, filter, skip } from "rxjs/operators";
import { Document } from '../../../client/client'
import { AppState, ContentChangedOrigin } from "../../../main-app/app-state";
import { MarkDownRenderer, MathJaxRenderer, RenderableTrait, YouwolRenderer } from "./renderers";


/**
 * Render view
 */
export class RenderView implements VirtualDOM {

    static debounceTime = 500
    public readonly id = "render-view"
    public readonly class: string
    public readonly children: Array<VirtualDOM>

    public readonly document: Document
    public readonly appState: AppState

    public readonly renderedElement$ = new ReplaySubject<{
        document: Document,
        htmlElement: HTMLDivElement
    }>(1)

    public readonly renderers = [
        new MarkDownRenderer(),
        new MathJaxRenderer(),
        new YouwolRenderer()
    ]

    constructor(params: {
        document: Document,
        appState: AppState,
        class
    }) {
        Object.assign(this, params)
        let firstNodeLoad$ = this.appState.page$.pipe(
            filter(({ document, originId }) => {
                return document == this.document && originId == ContentChangedOrigin.nodeLoad
            })
        )
        let edition$ = this.appState.page$.pipe(
            filter(({ document, originId }) => {
                return document == this.document && originId == ContentChangedOrigin.editor
            }),
            skip(1),
            debounceTime(RenderView.debounceTime)
        )
        this.children = [
            {
                class: 'w-100',
                connectedCallback: (htmlElement: HTMLElement$ & HTMLDivElement) => {

                    let sub = merge(
                        firstNodeLoad$,
                        edition$
                    ).subscribe(({ document, content }) => {
                        htmlElement.innerHTML = content
                        this.render(htmlElement, document)
                    })
                    htmlElement.ownSubscriptions(sub)
                }
            }
        ]
    }

    async render(htmlElement: HTMLDivElement, document: Document) {

        await this.renderers.reduce(
            async (accHtmlElement: Promise<HTMLElement>, renderer: RenderableTrait) => {
                return renderer.render(await accHtmlElement, {})
            },
            Promise.resolve(htmlElement)
        )
        this.renderedElement$.next({ document, htmlElement })
    }
}
