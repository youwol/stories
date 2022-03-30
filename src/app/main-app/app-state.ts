import { VirtualDOM } from '@youwol/flux-view'
import { BehaviorSubject, ReplaySubject } from 'rxjs'
import { ExplorerState, ExplorerView } from '../explorer/explorer.view'
import { AssetsGateway } from '@youwol/http-clients'
import { Code, Document, DocumentContent, Permissions, Story } from '../models'
import { handleError } from './utils'
import { DocumentNode, ExplorerNode, StoryNode } from '../explorer/nodes'
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

    public readonly codeEdition$ = new BehaviorSubject<Code | undefined>(
        undefined,
    )

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
        this.selectedNode$.subscribe(() => {
            this.removeCodeEditor()
        })

        this.plugins$.next(this.story.requirements.plugins)
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
            .pipe(handleError({ browserContext: 'rename document' }))
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

    addDocument(parentDocumentId: string, title: string) {
        const content = { html: '', css: '', components: '', styles: '' }
        this.client
            .createDocument$(this.story.storyId, {
                parentDocumentId: parentDocumentId,
                title,
                content,
            })
            .pipe(handleError({ browserContext: 'add document' }))
            .subscribe((document: Document) => {
                this.addedDocument$.next({ parentDocumentId, document })
            })
    }

    deleteDocument(document: Document) {
        this.deletedDocument$.next(document)
        this.client
            .deleteDocument$(document.storyId, document.documentId)
            .pipe(handleError({ browserContext: 'delete document' }))
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

    editCode(code: Code) {
        this.codeEdition$.next(code)
    }

    removeCodeEditor() {
        this.codeEdition$.next(undefined)
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
                            appState: this.state,
                        }),
                    }),
                ],
            },
        ]
    }
}
