import { HTMLElement$, VirtualDOM } from '@youwol/flux-view'
import { AppState } from '../app-state'
import { Code, CodeRequirements } from '../models'
import { BehaviorSubject, combineLatest, ReplaySubject, Subject } from 'rxjs'
import { fetchCodeMirror$ } from '../utils/cdn-fetch'
import { map } from 'rxjs/operators'
import CodeMirror from 'codemirror'

export class CodeEditorState {
    public readonly codeMirrorConfiguration: { [k: string]: unknown }
    public readonly codeMirrorEditor$ = new ReplaySubject<CodeMirror.Editor>()
    public readonly requirements: CodeRequirements
    public readonly htmlElementContainer$ = new Subject<HTMLDivElement>()
    public readonly content$: BehaviorSubject<string>

    constructor(params: {
        codeMirrorConfiguration: { [k: string]: unknown }
        content$: BehaviorSubject<string>
        requirements: CodeRequirements
    }) {
        Object.assign(this, params)
        combineLatest([
            this.htmlElementContainer$,
            fetchCodeMirror$(this.requirements),
        ])
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

export class CodeEditorView implements VirtualDOM {
    public readonly appState: AppState
    public readonly state: CodeEditorState
    public readonly class =
        'fv-bg-background fv-text-primary d-flex flex-column w-100 h-50'
    public readonly code: Code
    public readonly children: Array<VirtualDOM>
    public readonly style = {
        'font-size': 'initial',
    }
    constructor(params: { appState: AppState; code: Code }) {
        Object.assign(this, params)
        this.state = new CodeEditorState({
            codeMirrorConfiguration: this.code.configuration,
            content$: this.code.content$,
            requirements: this.code.requirements,
        })
        this.children = [
            {
                class: 'w-100 d-flex justify-content-center',
                children: [this.code.headerView(this.state)],
            },
            {
                class: 'w-100 flex-grow-1 overflow-auto',
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
