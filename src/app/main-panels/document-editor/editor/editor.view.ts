import { child$, VirtualDOM } from "@youwol/flux-view";
import { debounceTime, mergeMap, tap } from "rxjs/operators";
import { AppState } from "../../../main-app/app-state";
import { Client } from "../../../client/client";
import { DocumentNode } from "../../../explorer/nodes"
import { forkJoin, ReplaySubject, Subject } from "rxjs";
import { fetchCodeMirror$ } from "../../../utils/cdn-fetch";
import { CodeMirror } from "../../../../tests/mock-packages";

type CodeMirrorEditor = any

/**
 * Logic side of [[EditorView]]
 */
 export class EditorState implements VirtualDOM {

    static debounceTime = 1000
    static codeMirror$ = fetchCodeMirror$

    public readonly node : DocumentNode
    public readonly appState: AppState

    public readonly content$ : ReplaySubject<string>
    public readonly saved$ = new Subject<boolean>() 

    /**
     * This editor gets initialized after the required assets
     * have been fetched from the CDN
     */
    public readonly codeMirrorEditor$ = new ReplaySubject<CodeMirrorEditor>(1)

    configurationCodeMirror = {
        value: "",
        mode: 'markdown',
        lineNumbers: false,
        theme: 'blackboard'
    }

    constructor( params: {
        node: DocumentNode,
        appState: AppState,
        content$: ReplaySubject<string>
    }) {
        Object.assign(this, params)

        this.content$.pipe(
            debounceTime(EditorState.debounceTime),
            mergeMap( (content) => Client.postContent$(this.node.story.storyId, this.node.document.documentId, content) )
        ).subscribe( (content) => {
            this.saved$.next(true)
        })
    }

    setContent( content: string) {
        this.content$.next(content)
    }

    setCodeMirrorEditor( editor: CodeMirrorEditor ) {
        this.codeMirrorEditor$.next(editor)
    }
}

/**
 * Editor view
 */
export class EditorView implements VirtualDOM {

    public readonly editorState: EditorState
    public readonly id = "editor-view"
    public readonly class: string
    public readonly children: Array<VirtualDOM>

    constructor( params: {
        editorState: EditorState,
        class: string
    }) {
        Object.assign(this, params)
        
        this.children = [
            {
                class: 'w-100 h-100',
                children: [
                    child$(
                        forkJoin([
                            EditorState.codeMirror$(),
                            Client.getContent$(
                                this.editorState.node.story.storyId, 
                                this.editorState.node.document.documentId)
                        ]),
                        ([_, content]) => {
                            return {
                                id: 'code-mirror-editor',
                                class: 'w-100 h-100',
                                connectedCallback: (elem) => {
                                    let config = {
                                        ...this.editorState.configurationCodeMirror, 
                                        value: content
                                    }
                                    let editor = window['CodeMirror'](elem, config)
                                    this.editorState.setContent(content)

                                    editor.on("changes", () => {
                                        this.editorState.setContent(editor.getValue())
                                    })
                                    this.editorState.setCodeMirrorEditor(editor)
                                }
                            }
                        }
                    )
                ]
            }
        ]
    }
}