import { child$, VirtualDOM } from '@youwol/flux-view'
import { BehaviorSubject, from, merge, Observable, ReplaySubject } from 'rxjs'
import { ExplorerState, ExplorerView } from './explorer'
import { AssetsGateway, StoriesBackend } from '@youwol/http-clients'
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
    setApplicationProperties,
} from '../common'

import { StoryTopBannerView } from './top-banner'
import { GrapesEditorView, GrapesEditorState } from './grapes-editor'
import { map, mapTo, mergeMap } from 'rxjs/operators'
import { installLoadingGraph } from '@youwol/cdn-client'
import { Code } from './models'
import { StructureTab } from '../common/side-nav.view'
import {
    CodePropertyEditorBottomNavTab,
    ComponentsBottomNavTab,
    CssBottomNavTab,
    JsBottomNavTab,
} from './bottom-nav'
import * as Dockable from '../common/dockable-tabs/dockable-tabs.view'
import { HttpHandler } from './http-handler'

type GetGlobalContentResponse = StoriesBackend.GetGlobalContentResponse
/**
 * @category Data Structure
 */
export enum SavingStatus {
    modified = 'Modified',
    started = 'Started',
    saved = 'Saved',
}

/**
 * Application state, logic side of [[AppView]]
 *
 * @category State
 */
export class AppState implements AppStateCommonInterface {
    /**
     * @group Immutable Constants
     */
    static debounceTimeSave = 1000

    /**
     * @group States
     */
    public readonly bottomNavState: Dockable.State

    /**
     * @group States
     */
    public readonly leftNavState: Dockable.State

    /**
     * @group States
     */
    public readonly explorerState: ExplorerState

    /**
     * @group States
     */
    public readonly grapesEditorState: GrapesEditorState

    /**
     * @group Observables
     */
    public readonly selectedNode$ = new ReplaySubject<ExplorerNode>(1)

    /**
     * @group Observables
     */
    public readonly addedDocument$ = new ReplaySubject<{
        document: Document
        parentDocumentId: string
    }>(1)

    /**
     * @group Observables
     */
    public readonly deletedDocument$ = new ReplaySubject<Document>(1)

    /**
     * @group Observables
     */
    public readonly save$ = new ReplaySubject<{
        document: Document
        content: DocumentContent
        status: SavingStatus
    }>(1)

    /**
     * @group Observables
     */
    public readonly plugins$ = new BehaviorSubject<string[]>([])

    /**
     * @group Observables
     */
    public readonly globalCss$: BehaviorSubject<string>

    /**
     * @group Observables
     */
    public readonly globalJavascript$: BehaviorSubject<string>

    /**
     * @group Observables
     */
    public readonly globalComponents$: BehaviorSubject<string>

    /**
     * @group Observables
     */
    public readonly codeEdition$ = new BehaviorSubject<Code | undefined>(
        undefined,
    )
    /**
     * @group Observables
     */
    public readonly dispositionChanged$ = new Observable<true>()

    /**
     * Initial story loaded.
     *
     * @group Immutable Constants
     */
    public readonly story: Story

    /**
     * Initial global contents.
     *
     * @group Immutable Constants
     */
    public readonly globalContents: GetGlobalContentResponse

    /**
     * @group Immutable Constants
     */
    public readonly rootDocument: Document

    /**
     * User's permissions on the story
     * @group Immutable Constants
     */
    public readonly permissions: Permissions

    /**
     * @group HTTP
     */
    public readonly httpHandler: HttpHandler

    /**
     * @group HTTP
     */
    public readonly storiesClient = new AssetsGateway.AssetsGatewayClient()
        .stories

    constructor(params: {
        story: Story
        globalContents: GetGlobalContentResponse
        rootDocument: Document
        permissions?
    }) {
        Object.assign(this, params)

        this.globalCss$ = new BehaviorSubject<string>(this.globalContents.css)
        this.globalJavascript$ = new BehaviorSubject<string>(
            this.globalContents.javascript,
        )
        this.globalComponents$ = new BehaviorSubject<string>(
            this.globalContents.components,
        )

        this.bottomNavState = new Dockable.State({
            disposition: 'bottom',
            viewState$: new BehaviorSubject<Dockable.DisplayMode>('collapsed'),
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

        this.httpHandler = new HttpHandler({
            storyId: this.story.storyId,
            command$: this.explorerState.directUpdates$.pipe(
                map((updates) => updates.map((update) => update.command)),
            ),
        })

        this.leftNavState = new Dockable.State({
            disposition: 'left',
            viewState$: new BehaviorSubject<Dockable.DisplayMode>('pined'),
            tabs$: new BehaviorSubject([
                new StructureTab({
                    explorerView: new ExplorerView({
                        explorerState: this.explorerState,
                    }),
                }),
            ]),
            selected$: new BehaviorSubject<string>('structure'),
        })

        this.selectedNode$.subscribe(() => {
            this.removeCodeEditor()
        })

        this.plugins$.next(this.story.requirements.plugins)
        this.dispositionChanged$ = merge(
            this.bottomNavState.viewState$,
            this.leftNavState.viewState$,
        ).pipe(mapTo(true))

        this.grapesEditorState = new GrapesEditorState({
            appState: this,
        })
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
        this.storiesClient
            .updateDocument$({
                storyId: doc.storyId,
                documentId: doc.documentId,
                body,
            })
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
        this.storiesClient
            .createDocument$({
                storyId: this.story.storyId,
                body: {
                    parentDocumentId: parentDocumentId,
                    title,
                },
            })
            .pipe(handleError({ browserContext: 'add document' }))
            .subscribe((document: Document) => {
                this.addedDocument$.next({ parentDocumentId, document })
            })
    }

    deleteDocument(document: Document) {
        this.deletedDocument$.next(document)
        this.storiesClient
            .deleteDocument$({
                storyId: document.storyId,
                documentId: document.documentId,
            })
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
        this.storiesClient
            .addPlugin$({ storyId: this.story.storyId, body: { packageName } })
            .pipe(
                handleError({ browserContext: 'add plugin' }),
                mergeMap((resp) => {
                    return from(
                        installLoadingGraph({
                            loadingGraph: resp.requirements.loadingGraph as any,
                        }),
                    )
                }),
            )
            .subscribe(() => {
                this.plugins$.next([...actualPlugins, packageName])
            })
    }

    editCode(code: Code) {
        const tabs = this.bottomNavState.tabs$
            .getValue()
            .filter((t) => !(t instanceof CodePropertyEditorBottomNavTab))
        const propertyTab = new CodePropertyEditorBottomNavTab({
            appState: this,
            code,
        })
        this.bottomNavState.tabs$.next([propertyTab, ...tabs])
        this.bottomNavState.selected$.next('code-property-editor')
        if (this.bottomNavState.viewState$.getValue() == 'collapsed') {
            this.bottomNavState.viewState$.next('expanded')
        }
    }

    removeCodeEditor() {
        this.bottomNavState.selected$.next('css')
        const tabs = this.bottomNavState.tabs$
            .getValue()
            .filter((t) => !(t instanceof CodePropertyEditorBottomNavTab))
        this.codeEdition$.next(undefined)
        this.bottomNavState.tabs$.next(tabs)
    }

    applyGlobals(globals: {
        css?: string
        javascript?: string
        components?: string
    }) {
        this.storiesClient
            .updateGlobalContents$({
                storyId: this.story.storyId,
                body: globals,
            })
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
 * Application's view
 *
 * @category Getting Started
 * @category View
 */
export class AppView implements VirtualDOM {
    /**
     * @group States
     */
    public readonly state: AppState

    /**
     * @group Immutable Constants
     */
    public readonly class = 'fv-text-primary d-flex flex-column w-100 h-100'

    /**
     * @group Immutable Constants
     */
    public readonly children: Array<VirtualDOM>

    constructor(params: { state: AppState }) {
        Object.assign(this, params)

        setApplicationProperties({
            storyId: this.state.story.storyId,
            mode: 'writer',
        })

        let sideNav = new Dockable.View({
            state: this.state.leftNavState,
            styleOptions: { initialPanelSize: '300px' },
        })
        this.children = [
            new StoryTopBannerView(this.state),
            {
                class: 'd-flex flex-grow-1 overflow-auto',
                style: {
                    position: 'relative',
                    minHeight: '0px',
                },
                children: [
                    child$(sideNav.placeholder$, (d) => d),
                    sideNav,
                    new GrapesEditorView({
                        state: this.state.grapesEditorState,
                    }),
                ],
            },
            new Dockable.View({
                state: this.state.bottomNavState,
                styleOptions: { initialPanelSize: '50%' },
            }),
        ]
    }
}
