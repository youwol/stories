import { AppState } from '../app-state'
import {
    debounceTime,
    distinctUntilChanged,
    map,
    mergeMap,
    skip,
    take,
    tap,
} from 'rxjs/operators'
import { ExplorerNode, handleError } from '../../common'
import { AssetsGateway, StoriesBackend } from '@youwol/http-clients'
import { BehaviorSubject, of } from 'rxjs'
import grapesjs from 'grapesjs'

type Document = StoriesBackend.DocumentContentBody

const wrapperComponent = (
    node: ExplorerNode,
    resp: StoriesBackend.DocumentContentBody,
) => ({
    type: 'wrapper',
    style: {
        height: '100vh',
        width: '100vw',
    },
    attributes: {
        documentId: node.id,
        id: `wrapper_${node.id}`,
    },
    components: JSON.parse(resp.components == '' ? '[]' : resp.components),
})

/**
 * @category HTTP
 */
export class StorageManager {
    static type = 'YouWolStorage'
    /**
     * @group States
     */
    public readonly appState: AppState
    /**
     * @group HTTP
     */
    public readonly client = new AssetsGateway.AssetsGatewayClient().stories

    /**
     * @group Observables
     */
    public documentsChange$: {
        [k: string]: BehaviorSubject<Document>
    } = {}

    constructor(params: { appState: AppState }) {
        Object.assign(this, params)
    }
    async load(): Promise<grapesjs.ProjectData> {
        return new Promise((resolve) => {
            this.appState.selectedNode$
                .pipe(
                    take(1),
                    mergeMap((node: ExplorerNode) => {
                        if (this.documentsChange$[node.id]) {
                            return of([
                                node,
                                this.documentsChange$[node.id].getValue(),
                            ])
                        }
                        return this.client
                            .getContent$({
                                storyId: node.getDocument().storyId,
                                documentId: node.getDocument().documentId,
                            })
                            .pipe(
                                handleError({
                                    browserContext: 'Selected node raw content',
                                }),
                                tap((resp) => {
                                    this.createCache(node.id, resp)
                                }),
                                map((resp) => [node, resp]),
                            )
                    }),
                )
                .subscribe(
                    ([node, resp]: [
                        ExplorerNode,
                        StoriesBackend.DocumentContentBody,
                    ]) => {
                        const project = {
                            pages: [
                                {
                                    component: wrapperComponent(node, resp),
                                },
                            ],
                            styles:
                                resp.styles == ''
                                    ? '[]'
                                    : JSON.parse(resp.styles),
                        }
                        console.log('Loaded ' + node.id, { project, resp })
                        resolve(project)
                    },
                )
        })
    }

    store(data) {
        const frame = data.pages[0].frames[0]
        const wrapper = frame.component
        const documentId = wrapper.attributes.documentId
        const document: StoriesBackend.DocumentContentBody = {
            html: this.appState.grapesEditorState.nativeEditor.getHtml(),
            css: this.appState.grapesEditorState.nativeEditor.getCss() as string,
            components: JSON.stringify(wrapper.components) || '[]',
            styles: JSON.stringify(data.styles),
        }
        this.documentsChange$[documentId].next(document)
        return Promise.resolve()
    }

    createCache(documentId: string, document: Document) {
        this.documentsChange$[documentId] = new BehaviorSubject(document)
        const order = (record: {
            components: string
            css: string
            html: string
            styles: string
        }) => {
            // ordering is needed as (initial) documents from remote storage & documents sent by grapesjs
            // are not ordered the same way
            return ['components', 'css', 'html', 'styles'].reduce(
                (acc, e) => ({ ...acc, [e]: record[e] }),
                {},
            )
        }
        this.documentsChange$[documentId]
            .pipe(
                // This is especially relevant at load time since 2 events with same content but different
                // properties' order are emitted
                distinctUntilChanged((record0, record1) => {
                    return (
                        JSON.stringify(order(record0)) ==
                        JSON.stringify(order(record1))
                    )
                }),
                // Skip saving of the initial load, usually not a big deal.
                // However, if the story is downloading from the remote but not yet downloaded,
                // saving it right away will cause an error. By the time the user modify the document, it is likely
                // that the story's download finished.
                skip(1),
                tap(() => {
                    const node = this.appState.explorerState.getNode(documentId)
                    return node.addProcess({
                        type: 'content-changed',
                        id: 'content-changed',
                    })
                }),
                debounceTime(AppState.debounceTimeSave),
                tap(() => {
                    const node = this.appState.explorerState.getNode(documentId)
                    node.removeProcess('content-changed')
                    node.addProcess({
                        type: 'content-saving',
                        id: 'content-saving',
                    })
                }),
                mergeMap((toSave: StoriesBackend.UpdateContentBody) => {
                    return this.client.updateContent$({
                        storyId: this.appState.story.storyId,
                        documentId: documentId,
                        body: toSave,
                    })
                }),
                handleError({ browserContext: 'save document' }),
            )
            .subscribe(() => {
                console.log(`Saved ${documentId}`)
                const node = this.appState.explorerState.getNode(documentId)
                node.removeProcess('content-saving')
            })
    }
}
