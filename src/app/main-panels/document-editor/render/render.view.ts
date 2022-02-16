import { HTMLElement$, VirtualDOM } from '@youwol/flux-view'
import { merge, ReplaySubject } from 'rxjs'
import { debounceTime, filter } from 'rxjs/operators'
import { Document } from '../../../models'
import { AppState, ContentChangedOrigin } from '../../../main-app/app-state'
import {
    MarkDownRenderer,
    MathJaxRenderer,
    RenderableTrait,
    YouwolRenderer,
} from './renderers'

/**
 * Render view
 */
export class RenderView implements VirtualDOM {
    static debounceTime = 500
    public readonly id = 'render-view'
    public readonly class: string
    public readonly children: Array<VirtualDOM>

    public readonly document: Document
    public readonly appState: AppState

    public readonly renderedElement$ = new ReplaySubject<{
        document: Document
        htmlElement: HTMLDivElement
    }>(1)

    public readonly renderers = [
        new MarkDownRenderer(),
        new MathJaxRenderer(),
        new YouwolRenderer(),
    ]

    constructor(params: { document: Document; appState: AppState; class }) {
        Object.assign(this, params)

        const thisPage$ = this.appState.page$.pipe(
            filter(({ document }) => {
                return document == this.document
            }),
        )

        const firstNodeLoad$ = thisPage$.pipe(
            filter(({ originId }) => {
                return originId == ContentChangedOrigin.nodeLoad
            }),
        )
        const edition$ = thisPage$.pipe(
            filter(({ originId }) => {
                return originId == ContentChangedOrigin.editor
            }),
            debounceTime(RenderView.debounceTime),
        )

        const reloadContent$ = merge(
            //thisPage$.pipe(take(1)),
            firstNodeLoad$,
            edition$,
        )
        this.children = [
            {
                class: 'w-100',
                connectedCallback: (
                    htmlElement: HTMLElement$ & HTMLDivElement,
                ) => {
                    const sub = reloadContent$.subscribe(
                        ({ document, content }) => {
                            htmlElement.innerHTML = content
                            this.render(htmlElement, document)
                        },
                    )
                    htmlElement.ownSubscriptions(sub)
                },
            },
        ]
    }

    async render(htmlElement: HTMLDivElement, document: Document) {
        await this.renderers.reduce(
            async (
                accHtmlElement: Promise<HTMLElement>,
                renderer: RenderableTrait,
            ) => {
                return renderer.render(await accHtmlElement, {})
            },
            Promise.resolve(htmlElement),
        )
        this.renderedElement$.next({ document, htmlElement })
    }
}
