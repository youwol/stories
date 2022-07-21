import { HTMLElement$, VirtualDOM } from '@youwol/flux-view'
import { AppState } from '../app-state'
import { Code } from '../models'
import { BehaviorSubject, combineLatest, ReplaySubject, Subject } from 'rxjs'
import { fetchCodeMirror$ } from '../utils'
import { map } from 'rxjs/operators'
import CodeMirror from 'codemirror'
import { CodeRequirements } from '../../common'

/**
 * @category State
 */
export class CodeEditorState {
    /**
     * @group Immutable Constants
     */
    public readonly codeMirrorConfiguration: { [k: string]: unknown }

    /**
     * @group Observables
     */
    public readonly codeMirrorEditor$ = new ReplaySubject<CodeMirror.Editor>()

    /**
     * @group Immutable Constants
     */
    public readonly requirements: CodeRequirements

    /**
     * @group Observables
     */
    public readonly htmlElementContainer$ = new Subject<HTMLDivElement>()

    /**
     * @group Observables
     */
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

/**
 * @category View
 * @category Getting Started
 */
export class CodeEditorView implements VirtualDOM {
    /**
     * @group States
     */
    public readonly appState: AppState
    /**
     * @group States
     */
    public readonly state: CodeEditorState

    /**
     * @group Immutable DOM Constants
     */
    public readonly class =
        'fv-bg-background fv-text-primary d-flex w-100 h-100'
    /**
     * @group Immutable Constants
     */
    public readonly code: Code
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: Array<VirtualDOM>
    /**
     * @group Immutable DOM Constants
     */
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
                class: 'd-flex flex-column px-1',
                children: [this.code.headerView(this.state)],
            },
            {
                class: 'w-100 flex-grow-1 overflow-auto',
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
