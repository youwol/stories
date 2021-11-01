import { child$, HTMLElement$, VirtualDOM } from "@youwol/flux-view";
import { filter, take } from "rxjs/operators";
import { AppState, ContentChangedOrigin } from "../../../main-app/app-state";
import { Document } from "../../../client/client"
import { merge, ReplaySubject } from "rxjs";
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

    public readonly emojis$ = new ReplaySubject<string>(1)

    public readonly configurationCodeMirror = {
        value: "",
        mode: 'markdown',
        lineNumbers: false,
        theme: 'blackboard',
        lineWrapping: true,
        indentUnit: 4
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

        let reloadContent$ = merge(
            this.appState.page$.pipe(
                filter(({ document }) => document == this.document),
                take(1)),
            this.appState.page$.pipe(
                filter(({ document }) => document == this.document),
                filter(({ content, originId }) => originId != ContentChangedOrigin.editor)
            )
        )
        this.children = [
            this.headerView(),
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
                                        value: "",
                                        readOnly: !this.appState.permissions.write
                                    }

                                    let editor = window['CodeMirror'](elem, config)
                                    editor.on("changes", (_, changeObj) => {
                                        if (changeObj.length == 1 && changeObj[0].origin == "setValue")
                                            return
                                        this.appState.setContent(this.document, editor.getValue(), ContentChangedOrigin.editor)
                                    })

                                    elem.ownSubscriptions(
                                        reloadContent$.subscribe(({ content, originId }) => {
                                            editor.setValue(content)
                                        }),
                                        this.emojis$.subscribe((text) => {
                                            var doc = editor.getDoc();
                                            var cursor = doc.getCursor();
                                            doc.replaceRange(text, cursor);
                                        })
                                    )
                                    this.codeMirrorEditor$.next(editor)
                                }
                            }
                        }
                    )
                ]
            }
        ]
    }

    headerView() {

        return {
            children: [
                {
                    class: 'd-flex w-100 align-items-center',
                    children: [
                        {
                            tag: 'i',
                            class: 'fv-pointer rounded m-1 fas fa-smile editor-view-header-emoji',
                            onclick: () => popupEmojisBrowserModal(this.emojis$)
                        }
                    ]
                },
            ]
        }
    }
}
