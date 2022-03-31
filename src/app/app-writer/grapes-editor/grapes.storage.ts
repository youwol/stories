import { AppState } from '../app-state'
import { mergeMap, take } from 'rxjs/operators'
import { ExplorerNode } from '../explorer/nodes'
import { handleError } from '../utils'
import { AssetsGateway } from '@youwol/http-clients'

export class StorageManager {
    static type = 'YouWolStorage'
    public readonly appState: AppState
    public readonly client = new AssetsGateway.AssetsGatewayClient().raw.story

    constructor(params: { appState: AppState }) {
        Object.assign(this, params)
    }

    load(keys, clb, _clbErr) {
        this.appState.selectedNode$
            .pipe(
                take(1),
                mergeMap((node: ExplorerNode) => {
                    return this.client.getContent$(
                        node.getDocument().storyId,
                        node.getDocument().documentId,
                    )
                }),
                handleError({
                    browserContext: 'Selected node raw content',
                }),
            )
            .subscribe((resp) => {
                clb({
                    'gjs-html': resp.html,
                    'gjs-css': resp.css,
                    'gjs-components': resp.components,
                    'gjs-styles': resp.styles,
                })
            })
    }

    store(data, clb, _clbErr) {
        this.appState.selectedNode$
            .pipe(
                take(1),
                mergeMap((node: ExplorerNode) => {
                    return this.client.updateContent$(
                        node.getDocument().storyId,
                        node.getDocument().documentId,
                        {
                            html: data['gjs-html'],
                            css: data['gjs-css'],
                            components: data['gjs-components'],
                            styles: data['gjs-styles'],
                        },
                    )
                }),
                handleError({ browserContext: 'save document' }),
            )
            .subscribe(() => {
                clb()
            })
    }
}
