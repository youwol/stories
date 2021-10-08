import { child$, VirtualDOM } from "@youwol/flux-view";
import { ImmutableTree } from "@youwol/fv-tree"
import { debounceTime, map, mergeMap, publish, share } from "rxjs/operators";
import { AppState } from "../../../app-state";
import { Client, Story } from "../../../client/client";
import { fetchBundles, fetchJavascriptAddOn, fetchStyleSheets } from '@youwol/cdn-client'
import { DocumentNode, Node } from "../../../explorer/nodes"
import { forkJoin, from, Observable, ReplaySubject } from "rxjs";

let urlsJs = [
    "codemirror#5.52.0~mode/javascript.min.js",
    "codemirror#5.52.0~mode/markdown.min.js",
    "codemirror#5.52.0~mode/css.min.js",
    "codemirror#5.52.0~mode/xml.min.js",
    "codemirror#5.52.0~mode/htmlmixed.min.js",
    "codemirror#5.52.0~mode/gfm.min.js"
]
let urlsCss = [
    "codemirror#5.52.0~codemirror.min.css",
    "codemirror#5.52.0~theme/blackboard.min.css"
]

export class EditorState {

    node: Node
    constructor({ node }: {
        node: Node
    }) {
        this.node = node
    }
}


function fetchCodeMirror$(): Observable<any> {
    let css = fetchStyleSheets(urlsCss)
    let jsCode = fetchBundles({
        codemirror: {
            version: '5.52.0',
            sideEffects: () => { }
        }
    }, window)
        .then(() => fetchJavascriptAddOn(urlsJs, window))
    return from(Promise.all([jsCode, css])).pipe(
        share()
    )
}


export class EditorView implements VirtualDOM {

    static codeMirror$ = fetchCodeMirror$()

    public readonly node : DocumentNode
    public readonly appState: AppState

    public readonly class = 'd-flex flex-column flex-grow-1 fv-bg-background-alt w-50 mr-1 ml-2 p-2'
    public readonly children: Array<VirtualDOM>

    public readonly content$ : ReplaySubject<string>
    
    configurationCodeMirror = {
        value: "state.content$.getValue()",
        mode: 'markdown',
        lineNumbers: false,
        theme: 'blackboard',
        extraKeys: {
            "Tab": (cm) => cm.replaceSelection("    ", "end")
        }
    }

    constructor( params: {
        node: DocumentNode,
        appState: AppState,
        content$
    }) {
        Object.assign(this, params)

        this.content$.pipe(
            debounceTime(500),
            mergeMap( (content) => Client.postContent$(this.node.document.documentId, content) )
        ).subscribe( (content) => {
        })
        
        this.children = [
            {
                class: 'w-100 flex-grow-1',
                children: [
                    child$(
                        forkJoin([
                            EditorView.codeMirror$,
                            Client.getContent$(this.node.story.storyId, this.node.document.documentId)
                        ]),
                        ([_, content]) => {
                            return {
                                id: 'code-mirror-editor',
                                class: 'w-100 h-100',
                                connectedCallback: (elem) => {
                                    let config = {...this.configurationCodeMirror, value: content}
                                    let editor = window['CodeMirror'](elem, config)
                                    this.content$.next(content)
                                    editor.on("changes", () => {
                                        this.content$.next(editor.getValue())
                                    })
                                }
                            }
                        }
                    )
                ]
            }
        ]
    }
}