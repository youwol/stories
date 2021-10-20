import { child$, HTMLElement$, VirtualDOM } from "@youwol/flux-view";
import { filter } from "rxjs/operators";
import { AppState, ContentChangedOrigin } from "../../../main-app/app-state";
import { Document } from "../../../client/client"
import { ReplaySubject } from "rxjs";
import { fetchCodeMirror$ } from "../../../utils/cdn-fetch";

type CodeMirrorEditor = any

/**
 * Editor view
 */
export class EditorView implements VirtualDOM {

    static codeMirror$ = fetchCodeMirror$()

    public readonly appState: AppState
    public readonly document: Document
    public readonly id = "editor-view"
    public readonly class: string
    public readonly children: Array<VirtualDOM>

    public readonly configurationCodeMirror = {
        value: "",
        mode: 'markdown',
        lineNumbers: false,
        theme: 'blackboard',
        lineWrapping: true
    }

    /**
     * This editor gets initialized after the required assets
     * have been fetched from the CDN
     */
    public readonly codeMirrorEditor$ = new ReplaySubject<CodeMirrorEditor>(1)

    constructor(params: {
        appState: AppState,
        document: Document,
        class: string
    }) {
        Object.assign(this, params)

        this.children = [
            {
                class: 'w-100 h-100',
                children: [
                    child$(
                        EditorView.codeMirror$,
                        () => {
                            return {
                                id: 'code-mirror-editor',
                                class: 'w-100 h-100',
                                connectedCallback: (elem: HTMLElement$) => {

                                    let config = {
                                        ...this.configurationCodeMirror,
                                        value: ""
                                    }

                                    let editor = window['CodeMirror'](elem, config)
                                    editor.on("changes", (_, changeObj) => {
                                        if (changeObj.length == 1 && changeObj[0].origin == "setValue")
                                            return
                                        this.appState.setContent(this.document, editor.getValue(), ContentChangedOrigin.editor)
                                    })

                                    let sub = this.appState.page$.pipe(
                                        filter(({ document }) => document == this.document)
                                    )
                                        .subscribe(({ content, originId }) => {
                                            if (originId != ContentChangedOrigin.editor)
                                                editor.setValue(content)
                                        })

                                    this.codeMirrorEditor$.next(editor)
                                    elem.ownSubscriptions(sub)
                                }
                            }
                        }
                    )
                ]
            }
        ]
    }
}
