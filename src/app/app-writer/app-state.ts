import { VirtualDOM } from '@youwol/flux-view'
import { BehaviorSubject, from, ReplaySubject } from 'rxjs'
import { ExplorerState, ExplorerView } from './explorer/explorer.view'
import { AssetsGateway } from '@youwol/http-clients'
import {
    handleError,
    Document,
    DocumentContent,
    Permissions,
    Story,
    DocumentNode,
    ExplorerNode,
    StoryNode,
    AppStateCommonInterface,
} from '../common'

import { TopBannerState, TopBannerView } from './top-banner'
import { GrapesEditorView } from './grapes-editor/grapes.view'
import { GrapesEditorState } from './grapes-editor/grapes.state'
import { mergeMap } from 'rxjs/operators'
import { fetchLoadingGraph } from '@youwol/cdn-client'
import { Code } from './models'
import { SideNavView } from '../common/side-nav.view'
import {
    BottomNav,
    BottomNavState,
    BottomNavViewState,
} from './bottom-nav/bottom-nav'
import { GetGlobalContentResponse } from '@youwol/http-clients/dist/lib/stories-backend'
import {
    ComponentsBottomNavTab,
    CssBottomNavTab,
    JsBottomNavTab,
} from './bottom-nav/predefined-tabs'

export enum SavingStatus {
    modified = 'Modified',
    started = 'Started',
    saved = 'Saved',
}

/**
 * Global application state, logic side of [[AppView]]
 */
export class AppState implements AppStateCommonInterface {
    static debounceTimeSave = 1000
    public readonly topBannerState: TopBannerState
    public readonly bottomNavState: BottomNavState

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

    public readonly globalCss$: BehaviorSubject<string>
    public readonly globalJavascript$: BehaviorSubject<string>
    public readonly globalComponents$: BehaviorSubject<string>

    public readonly story: Story
    public readonly globalContents: GetGlobalContentResponse
    public readonly rootDocument: Document
    public readonly permissions: Permissions

    public readonly client = new AssetsGateway.AssetsGatewayClient().raw.story
    public readonly storiesClient = new AssetsGateway.AssetsGatewayClient()
        .stories

    public readonly codeEdition$ = new BehaviorSubject<Code | undefined>(
        undefined,
    )

    constructor(params: {
        story: Story
        globalContents: GetGlobalContentResponse
        rootDocument: Document
        permissions?
    }) {
        Object.assign(this, params)

        this.topBannerState = new TopBannerState({
            permissions: this.permissions,
        })

        this.globalCss$ = new BehaviorSubject<string>(this.globalContents.css)
        this.globalJavascript$ = new BehaviorSubject<string>(
            this.globalContents.javascript,
        )
        this.globalComponents$ = new BehaviorSubject<string>(
            this.globalContents.components,
        )

        this.bottomNavState = new BottomNavState({
            viewState$: new BehaviorSubject<BottomNavViewState>('collapsed'),
            tabs$: new BehaviorSubject([
                new CssBottomNavTab({ appState: this }),
                new JsBottomNavTab({ appState: this }),
                new ComponentsBottomNavTab({ appState: this }),
            ]),
            selected$: new BehaviorSubject<string>('css'),
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
        this.client
            .createDocument$(this.story.storyId, {
                parentDocumentId: parentDocumentId,
                title,
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
        this.client
            .addPlugin$(this.story.storyId, { packageName })
            .pipe(
                handleError({ browserContext: 'add plugin' }),
                mergeMap((resp) => {
                    return from(
                        fetchLoadingGraph(
                            resp.requirements.loadingGraph as any,
                        ),
                    )
                }),
            )
            .subscribe(() => {
                this.plugins$.next([...actualPlugins, packageName])
            })
    }

    editCode(code: Code) {
        this.codeEdition$.next(code)
    }

    removeCodeEditor() {
        this.codeEdition$.next(undefined)
    }

    applyGlobals(globals: {
        css?: string
        javascript?: string
        components?: string
    }) {
        this.storiesClient
            .updateGlobalContents$(this.story.storyId, globals)
            .pipe(
                handleError({
                    browserContext: 'appState.applyGlobals',
                }),
            )
            .subscribe()
        globals.css && this.globalCss$.next(globals.css)
        globals.javascript && this.globalJavascript$.next(globals.javascript)
        globals.components && this.globalComponents$.next(globals.components)
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
        let sideNav = new SideNavView({
            content: new ExplorerView({
                explorerState: this.state.explorerState,
            }),
        })
        this.children = [
            new TopBannerView(this.state.topBannerState),
            {
                class: 'd-flex flex-grow-1',
                style: {
                    position: 'relative',
                    minHeight: '0px',
                },
                children: [
                    sideNav,
                    new GrapesEditorView({
                        state: new GrapesEditorState({
                            appState: this.state,
                        }),
                    }),
                ],
            },
            new BottomNav({ state: this.state.bottomNavState }),
        ]
    }
}
