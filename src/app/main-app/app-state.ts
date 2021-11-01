import { VirtualDOM, render } from "@youwol/flux-view";
import { ReplaySubject, forkJoin, Observable } from "rxjs";
import { Story, Document, Client } from "../client/client";
import { ClientApi } from "../client/API";
import { ExplorerState, ExplorerView } from "../explorer/explorer.view";
import { DocumentNode, ExplorerNode, StoryNode } from "../explorer/nodes";
import { distinctUntilChanged, filter, map, mergeMap, tap } from "rxjs/operators"
import { DocumentEditorView } from "../main-panels/document-editor/document-editor.view";
import { TopBannerState, TopBannerView } from "./top-banner";

/**
 * 
 * @param storyId id of the story to load
 * @param container where to insert the main view
 * @returns application state & application view
 */
export function load$(storyId: string, container: HTMLElement): Observable<{ appState: AppState, appView: AppView }> {
    container.innerHTML = ""

    return forkJoin([
        Client.getStory$(storyId),
        Client.getChildren$(storyId, { parentDocumentId: storyId, count: 1 }).pipe(
            map(docs => docs[0])
        )
    ]).pipe(
        map(([{ story, permissions }, rootDocument]: any) => {
            let appState = new AppState({ story, rootDocument, permissions })
            let appView = new AppView({ state: appState })
            return { appState, appView }
        }),
        tap(({ appView }) => container.appendChild(render(appView)))
    )
}

export enum SavingStatus {
    modified = "Modified",
    started = "Started",
    saved = "Saved"
}

export enum ContentChangedOrigin {
    editor = "editor",
    nodeLoad = "loaded"
}


/**
 * Global application state, logic side of [[AppView]]
 */
export class AppState {

    static debounceTimeSave = 1000
    public readonly topBannerState: TopBannerState

    public readonly explorerState: ExplorerState
    public readonly selectedNode$ = new ReplaySubject<ExplorerNode>(1)
    public readonly page$ = new ReplaySubject<{ document: Document, content: string, originId: ContentChangedOrigin }>(1)

    public readonly addedDocument$ = new ReplaySubject<{ document: Document, parentDocumentId: string }>(1)
    public readonly deletedDocument$ = new ReplaySubject<Document>(1)

    public readonly save$ = new ReplaySubject<{ document: Document, content: string, status: SavingStatus }>(1)
    public readonly story: Story
    public readonly rootDocument: Document
    public readonly permissions: ClientApi.Permissions

    constructor(params: {
        story: Story,
        rootDocument: Document,
        permissions
    }) {
        Object.assign(this, params)

        this.topBannerState = new TopBannerState({ permissions: this.permissions })

        this.explorerState = new ExplorerState({
            rootDocument: this.rootDocument,
            appState: this
        })

        this.selectedNode$.pipe(
            distinctUntilChanged(),
            mergeMap((node: ExplorerNode) => {
                return Client
                    .getContent$(node.getDocument().storyId, node.getDocument().documentId)
                    .pipe(
                        map(content => ({ content, node }))
                    )
            })
        )
            .subscribe(({ node, content }) => {
                this.page$.next({ document: node.getDocument(), content, originId: ContentChangedOrigin.nodeLoad })
            })

        this.page$.pipe(
            filter(({ originId }) => {
                return originId == ContentChangedOrigin.editor
            })
        ).subscribe(({ document, content }) => {
            this.save$.next({ document, content, status: SavingStatus.modified })
        })

        /*this.page$.pipe(
            filter(({ originId }) => {
                return originId == ContentChangedOrigin.editor
            }),
            tap(({ document }) => {
                this.save$.next({ document, status: SavingStatus.started })
            }),
            debounceTime(AppState.debounceTimeSave),
            mergeMap(({ document, content }) => {
                return Client.postContent$(
                    document.storyId,
                    document.documentId,
                    { content }
                ).pipe(map(() => ({ content, document })))
            })
        ).subscribe(({ document, content }) => {
            this.save$.next({ document, status: SavingStatus.done })
        })
        */
    }

    save(document: Document, content: string) {
        this.save$.next({ document, content, status: SavingStatus.started })
        Client.postContent$(
            document.storyId,
            document.documentId,
            { content }
        ).pipe(
            map(() => ({ content, document }))
        ).subscribe(() => {
            this.save$.next({ document, content, status: SavingStatus.saved })
        })
    }

    setContent(document: Document, content: string, originId: ContentChangedOrigin) {
        this.page$.next({ document, content, originId })
    }

    selectNode(node: ExplorerNode) {
        this.selectedNode$.next(node)
    }

    rename(node: DocumentNode | StoryNode, newName: string) {

        let doc = node.getDocument()
        let body = {
            documentId: doc.documentId,
            title: newName
        }
        Client.postDocument$(doc.storyId, doc.documentId, body)
            .subscribe((newDoc: Document) => {
                node instanceof DocumentNode
                    ? this.explorerState.replaceAttributes(
                        node,
                        { document: newDoc })
                    : this.explorerState.replaceAttributes(
                        node,
                        { story: new Story({ ...node.story, title: newName }) })
            })
    }

    addDocument(parentDocumentId: string, { title, content }: { title: string, content: string }) {

        Client.putDocument$(
            this.story.storyId,
            {
                parentDocumentId: parentDocumentId,
                title,
                content
            }
        )
            .subscribe((document: Document) => {
                this.addedDocument$.next({ parentDocumentId, document })
            })
    }

    deleteDocument(document: Document) {
        this.deletedDocument$.next(document)
        Client
            .deleteDocument$(document.storyId, document.documentId)
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
    public readonly class = 'fv-bg-background fv-text-primary d-flex flex-column w-100 h-100'

    public readonly children: Array<VirtualDOM>

    constructor(params: { state: AppState }) {

        Object.assign(this, params)

        this.children = [
            new TopBannerView(this.state.topBannerState),
            {
                class: "d-flex flex-grow-1",
                style: { minHeight: '0px' },
                children: [
                    new ExplorerView({ explorerState: this.state.explorerState }),
                    new DocumentEditorView({ appState: this.state })
                ]
            }
        ]
    }
}
