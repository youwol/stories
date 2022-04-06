import { AppState } from '../app-state'
import {
    debounceTime,
    distinctUntilChanged,
    mergeMap,
    take,
    skip,
    tap,
} from 'rxjs/operators'
import { handleError, ExplorerNode } from '../../common'
import { AssetsGateway, StoriesBackend } from '@youwol/http-clients'
import { BehaviorSubject, of } from 'rxjs'

type Document = StoriesBackend.DocumentContentBody

export interface GjsData {
    'gsj-html': string
    'gsj-css': string
    'gsj-styles': string
    'gsj-components': string
}

export class StorageManager {
    static type = 'YouWolStorage'
    public readonly appState: AppState
    public readonly client = new AssetsGateway.AssetsGatewayClient().raw.story

    public documentsChange$: {
        [k: string]: BehaviorSubject<Document>
    } = {}

    constructor(params: { appState: AppState }) {
        Object.assign(this, params)
    }

    load(keys, clb, _clbErr) {
        this.appState.selectedNode$
            .pipe(
                take(1),
                mergeMap((node: ExplorerNode) => {
                    if (this.documentsChange$[node.id]) {
                        return of(this.documentsChange$[node.id].getValue())
                    }
                    return this.client
                        .getContent$(
                            node.getDocument().storyId,
                            node.getDocument().documentId,
                        )
                        .pipe(
                            handleError({
                                browserContext: 'Selected node raw content',
                            }),
                            tap((resp) => {
                                this.createCache(node.id, resp)
                            }),
                        )
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

    store(gjsData, clb, _clbErr) {
        const components = JSON.parse(gjsData['gjs-components'])
        if (components.length == 0) {
            // this is when the canvas is cleared before reloading the new document
            return
        }
        const documentId = components[0].attributes.id
        const document: StoriesBackend.DocumentContentBody = {
            html: gjsData['gjs-html'],
            css: gjsData['gjs-css'],
            components: gjsData['gjs-components'],
            styles: gjsData['gjs-styles'],
        }
        this.documentsChange$[documentId].next(document)
    }

    createCache(documentId: string, document: Document) {
        this.documentsChange$[documentId] = new BehaviorSubject(document)
        this.documentsChange$[documentId]
            .pipe(
                skip(1),
                distinctUntilChanged((x, y) => {
                    return x.components == y.components
                }),
                tap(() => {
                    this.appState.setDocumentStatus(
                        documentId,
                        'content-changed',
                    )
                }),
                debounceTime(AppState.debounceTimeSave),
                tap(() => {
                    this.appState.setDocumentStatus(
                        documentId,
                        'content-saving',
                    )
                }),
                mergeMap((toSave: AssetsGateway.DocumentContentBody) => {
                    return this.client.updateContent$(
                        this.appState.story.storyId,
                        documentId,
                        toSave,
                    )
                }),
                handleError({ browserContext: 'save document' }),
            )
            .subscribe(() => {
                this.appState.setDocumentStatus(documentId, 'content-saved')
            })
    }
}
