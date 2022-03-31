import { child$, HTMLElement$, VirtualDOM } from '@youwol/flux-view'
import { AppStateReader } from './app-state'
import { AssetsGateway } from '@youwol/http-clients'
import { handleError } from '../common'
import { mergeMap } from 'rxjs/operators'

export class PageView implements VirtualDOM {
    public readonly appState: AppStateReader
    public readonly class = 'flex-grow-1 h-100 p-3'
    public readonly children
    public readonly client = new AssetsGateway.AssetsGatewayClient().raw.story

    constructor(params: { appState: AppStateReader }) {
        Object.assign(this, params)
        this.children = [
            child$(
                this.appState.selectedNode$.pipe(
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
                (document) => {
                    return new PageContent({ innerHTML: document.html })
                },
            ),
        ]
    }
}

export class PageContent implements VirtualDOM {
    public readonly innerHTML: string
    public readonly connectedCallback: (
        elem: HTMLDivElement & HTMLElement$,
    ) => void

    constructor(params: { innerHTML: string }) {
        Object.assign(this, params)
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
