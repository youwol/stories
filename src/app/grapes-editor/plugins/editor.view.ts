import { BehaviorSubject, combineLatest, ReplaySubject, Subject } from 'rxjs'
import { fetchCodeMirror$ } from '../../utils/cdn-fetch'
import { map } from 'rxjs/operators'
import { HTMLElement$, VirtualDOM } from '@youwol/flux-view'

import CodeMirror from 'codemirror'

export class CodeEditorState {
    public readonly codeMirrorConfiguration: { [k: string]: unknown }
    public readonly codeMirrorEditor$ = new ReplaySubject<CodeMirror.Editor>()

    public readonly htmlElementContainer$ = new Subject<HTMLDivElement>()

    public readonly content$: BehaviorSubject<string>

    constructor(params: {
        codeMirrorConfiguration: { [k: string]: unknown }
        content$: BehaviorSubject<string>
    }) {
        Object.assign(this, params)
        combineLatest([this.htmlElementContainer$, fetchCodeMirror$()])
            .pipe(
                map(([elem, _]) => {
                    const config = {
                        ...this.codeMirrorConfiguration,
                        value: this.content$.getValue(),
                    }
                    const editor: CodeMirror.Editor = window['CodeMirror'](
                        elem,
                        config,
                    )
                    return editor
                }),
            )
            .subscribe((editor) => {
                editor.on('changes', (_, changeObj) => {
                    if (
                        changeObj.length == 1 &&
                        changeObj[0].origin == 'setValue'
                    ) {
                        return
                    }
                    this.content$.next(editor.getValue())
                })

                this.codeMirrorEditor$.next(editor)
            })
    }
}

/**
 * Editor view
 */
export class CodeEditorView implements VirtualDOM {
    static codeMirror$ = fetchCodeMirror$()
    public readonly state: CodeEditorState
    public readonly class = 'd-flex flex-column fv-text-primary'
    public readonly headerView: VirtualDOM
    public readonly children: Array<VirtualDOM>

    public readonly configurationCodeMirror = {
        value: '',
        mode: 'markdown',
        lineNumbers: true,
        theme: 'blackboard',
        lineWrapping: true,
        indentUnit: 4,
    }

    constructor(params: {
        state: CodeEditorState
        headerView?: VirtualDOM
        content$: BehaviorSubject<string>
    }) {
        Object.assign(this, params)

        this.children = [
            this.headerView,
            {
                class: 'w-100',
                style: {
                    height: '50vh',
                },
                children: [
                    {
                        id: 'code-mirror-editor',
                        class: 'w-100 h-100',
                        connectedCallback: (
                            elem: HTMLElement$ & HTMLDivElement,
                        ) => {
                            this.state.htmlElementContainer$.next(elem)
                        },
                    },
                ],
            },
        ]
    }
}
