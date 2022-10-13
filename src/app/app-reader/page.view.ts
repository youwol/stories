import {
    attr$,
    childrenWithReplace$,
    HTMLElement$,
    VirtualDOM,
} from '@youwol/flux-view'
import { AppStateReader } from './app-state'
import { AssetsGateway } from '@youwol/http-clients'
import { DocumentContent, handleError } from '../common'
import { filter, map, mergeMap, scan, shareReplay, tap } from 'rxjs/operators'
import { combineLatest, from } from 'rxjs'

/**
 * @category View
 */
export class PageView implements VirtualDOM {
    /**
     * @group States
     */
    public readonly appState: AppStateReader
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'flex-grow-1 h-100 p-1 d-flex flex-column'
    /**
     * @group Immutable DOM Constants
     */
    public readonly children //: VirtualDOM[]
    /**
     * @group HTTP
     */
    public readonly client = new AssetsGateway.AssetsGatewayClient().stories

    constructor(params: { appState: AppStateReader }) {
        Object.assign(this, params)
        const styleGlobal = document.createElement('style')
        styleGlobal.id = 'global-css'
        styleGlobal.innerHTML = this.appState.globalContents.css
        document.head.appendChild(styleGlobal)

        const allDocumentsInMemory$ = this.appState.preloadDocuments$.pipe(
            scan((acc, e) => [...acc, ...e], []),
            shareReplay({ bufferSize: 1, refCount: true }),
        )

        const currentPage$ = combineLatest([
            this.appState.selectedNode$,
            allDocumentsInMemory$,
        ]).pipe(
            //withLatestFrom(allDocumentsInMemory$),
            map(([node, docs]) => {
                return docs.find((doc) => doc.id == node.id)
            }),
            // it happens that allDocumentsInMemory$ are not yet updated w/ selectedNode$, it will...
            filter((page) => page != undefined),
            tap((page) => {
                let stylePage = document.head.querySelector('style#gjs-css')
                if (!stylePage) {
                    stylePage = document.createElement('style')
                    stylePage.id = 'gjs-css'
                    document.head.appendChild(stylePage)
                }
                stylePage.innerHTML = page.content.css
            }),
            shareReplay({ bufferSize: 1, refCount: true }),
        )

        this.children = childrenWithReplace$(
            from(
                new Function(this.appState.globalContents.javascript)()(window),
            ).pipe(
                mergeMap(() => allDocumentsInMemory$),
                handleError({
                    browserContext: 'PageView.constructor.getContent',
                }),
            ),
            (page) => {
                return {
                    class: attr$(currentPage$, (currentPage) =>
                        currentPage.id == page.id ? 'h-100 w-100' : 'd-none',
                    ),
                    children: [new PageContent(page.content)],
                }
            },
            {
                comparisonOperator: (a, b) => a.id == b.id,
            },
        )
    }
}

/**
 * @category View
 */
export class PageContent implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'h-100 w-100'

    /**
     * @group Immutable DOM Constants
     */
    public readonly innerHTML: string

    /**
     * @group Immutable DOM Constants
     */
    public readonly connectedCallback: (
        elem: HTMLDivElement & HTMLElement$,
    ) => void

    constructor(page: DocumentContent) {
        this.innerHTML = page.html
        this.connectedCallback = () => {
            const scripts = document.body.querySelectorAll('script')
            scripts.forEach((scriptToCopy) => {
                const script = document.createElement('script')
                script.innerHTML = scriptToCopy.innerHTML
                document.head.appendChild(script)
                scriptToCopy.remove()
            })
        }
    }
}
