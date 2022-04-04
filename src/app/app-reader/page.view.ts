import { child$, HTMLElement$, VirtualDOM } from '@youwol/flux-view'
import { AppStateReader } from './app-state'
import { AssetsGateway } from '@youwol/http-clients'
import { DocumentContent, handleError } from '../common'
import { distinctUntilChanged, mergeMap } from 'rxjs/operators'
import { from } from 'rxjs'

export class PageView implements VirtualDOM {
    public readonly appState: AppStateReader
    public readonly class = 'flex-grow-1 h-100 p-1'
    public readonly children
    public readonly client = new AssetsGateway.AssetsGatewayClient().raw.story

    constructor(params: { appState: AppStateReader }) {
        Object.assign(this, params)
        const styleElem = document.createElement('style')
        styleElem.id = 'global-css'
        styleElem.innerHTML = this.appState.globalContents.css
        document.head.appendChild(styleElem)

        this.children = [
            child$(
                from(
                    new Function(this.appState.globalContents.javascript)()(
                        window,
                    ),
                ).pipe(
                    mergeMap(() => this.appState.selectedNode$),
                    distinctUntilChanged(
                        (node1, node2) => node1.id == node2.id,
                    ),
                    mergeMap((node) => {
                        return this.client.getContent$(
                            node.story.storyId,
                            node.id,
                        )
                    }),
                    handleError({
                        browserContext: 'PageView.constructor.getContent',
                    }),
                ),
                (page) => {
                    return new PageContent(page)
                },
            ),
        ]
    }
}

export class PageContent implements VirtualDOM {
    public readonly class = 'h-100 w-100'
    public readonly innerHTML: string
    public readonly connectedCallback: (
        elem: HTMLDivElement & HTMLElement$,
    ) => void

    constructor(page: DocumentContent) {
        let styleElem = document.head.querySelector('style#gjs-css')
        if (!styleElem) {
            styleElem = document.createElement('style')
            styleElem.id = 'gjs-css'
            document.head.appendChild(styleElem)
        }
        styleElem.innerHTML = page.css
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
