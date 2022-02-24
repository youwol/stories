import { VirtualDOM } from '@youwol/flux-view'
import { BehaviorSubject, ReplaySubject } from 'rxjs'
import { ExplorerState, ExplorerView } from '../explorer/explorer.view'
import { AssetsGateway } from '@youwol/http-clients'
import {
    ContentChangedOrigin,
    Document,
    DocumentContent,
    Page,
    Permissions,
    Story,
} from '../models'
import { handleError } from './utils'
import { DocumentNode, ExplorerNode, StoryNode } from '../explorer/nodes'
import { distinctUntilChanged, filter, map, mergeMap } from 'rxjs/operators'
import { TopBannerState, TopBannerView } from './top-banner'
import { GrapesEditorView } from '../grapes-editor/grapes.view'
import { GrapesEditorState } from '../grapes-editor/grapes.state'

export enum SavingStatus {
    modified = 'Modified',
    started = 'Started',
    saved = 'Saved',
}

/**
 * Global application state, logic side of [[AppView]]
 */
export class AppState {
    static debounceTimeSave = 1000
    public readonly topBannerState: TopBannerState

    public readonly explorerState: ExplorerState
    public readonly selectedNode$ = new ReplaySubject<ExplorerNode>(1)
    public readonly page$ = new BehaviorSubject<Page>(undefined)

    public readonly addedDocument$ = new ReplaySubject<{
        document: Document
        parentDocumentId: string
    }>(1)
    public readonly deletedDocument$ = new ReplaySubject<Document>(1)

    public readonly save$ = new ReplaySubject<{
        document: Document
        content: DocumentContent
        status: SavingStatus
    }>(1)

    public readonly plugins$ = new BehaviorSubject<string[]>([])

    public readonly story: Story
    public readonly rootDocument: Document
    public readonly permissions: Permissions

    public readonly client = new AssetsGateway.AssetsGatewayClient().raw.story

    constructor(params: {
        story: Story
        rootDocument: Document
        permissions?
    }) {
        Object.assign(this, params)

        this.topBannerState = new TopBannerState({
            permissions: this.permissions,
        })

        this.explorerState = new ExplorerState({
            rootDocument: this.rootDocument,
            appState: this,
        })

        this.selectedNode$
            .pipe(
                distinctUntilChanged(),
                mergeMap((node: ExplorerNode) => {
                    return this.client
                        .getContent$(
                            node.getDocument().storyId,
                            node.getDocument().documentId,
                        )
                        .pipe(
                            handleError({
                                browserContext: 'Selected node raw content',
                            }),
                            map((content) => ({ content, node })),
                        )
                }),
            )
            .subscribe(({ node, content }) => {
                this.page$.next({
                    document: node.getDocument(),
                    content,
                    originId: 'loaded',
                })
            })
        this.page$
            .pipe(
                filter((page) => page != undefined),
                filter((page) => page.originId == 'editor'),
            )
            .subscribe((page) => {
                this.save(page)
            })
        this.plugins$.next(this.story.requirements.plugins)
    }

    save({ document, content }: Page) {
        this.client
            .updateContent$(document.storyId, document.documentId, content)
            .pipe(handleError({ browserContext: 'save document' }))
            .subscribe(() => {
                this.save$.next({
                    document,
                    content,
                    status: SavingStatus.saved,
                })
            })
    }

    setContent(
        document: Document,
        content: DocumentContent,
        originId: ContentChangedOrigin,
    ) {
        this.page$.next({ document, content, originId })
    }

    selectNode(node: ExplorerNode) {
        this.selectedNode$.next(node)
    }

    rename(node: DocumentNode | StoryNode, newName: string) {
        const doc = node.getDocument()
        const body = {
            documentId: doc.documentId,
            title: newName,
        }
        this.client
            .updateDocument$(doc.storyId, doc.documentId, body)
            .subscribe((newDoc: Document) => {
                node instanceof DocumentNode
                    ? this.explorerState.replaceAttributes(node, {
                          document: newDoc,
                      })
                    : this.explorerState.replaceAttributes(node, {
                          story: { ...node.story, title: newName },
                      })
            })
    }

    addDocument(
        parentDocumentId: string,
        { title, content }: { title: string; content: DocumentContent },
    ) {
        this.client
            .createDocument$(this.story.storyId, {
                parentDocumentId: parentDocumentId,
                title,
                content,
            })
            .subscribe((document: Document) => {
                this.addedDocument$.next({ parentDocumentId, document })
            })
    }

    deleteDocument(document: Document) {
        this.deletedDocument$.next(document)
        this.client
            .deleteDocument$(document.storyId, document.documentId)
            .subscribe(() => {
                // This is intentional: make the request happening
            })
    }

    togglePlugin(packageName: string) {
        let actualPlugins = this.plugins$.getValue()

        if (actualPlugins.includes(packageName)) {
            this.plugins$.next(actualPlugins.filter((p) => p != packageName))
            return
        }
        this.plugins$.next([...actualPlugins, packageName])
        this.client
            .addPlugin$(this.story.storyId, { packageName })
            .pipe(handleError({ browserContext: 'add plugin' }))
            .subscribe(() => {
                // This is intentional: make the request happening
            })
    }
}

/**
 * Global application's view
 */
export class AppView implements VirtualDOM {
    public readonly state: AppState
    public readonly class =
        'fv-bg-background fv-text-primary d-flex flex-column w-100 h-100'

    public readonly children: Array<VirtualDOM>

    constructor(params: { state: AppState }) {
        Object.assign(this, params)

        this.children = [
            new TopBannerView(this.state.topBannerState),
            {
                class: 'd-flex flex-grow-1',
                style: { minHeight: '0px' },
                children: [
                    new ExplorerView({
                        explorerState: this.state.explorerState,
                    }),
                    new GrapesEditorView({
                        state: new GrapesEditorState({
                            page$: this.state.page$,
                            appState: this.state,
                        }),
                    }),
                ],
            },
        ]
    }
}
