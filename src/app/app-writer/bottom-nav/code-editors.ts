import { CodeEditorView } from '../code-editor/code-editor.view'
import { BehaviorSubject, Subject } from 'rxjs'
import { VirtualDOM } from '@youwol/flux-view'
import { AppState } from '../app-state'

const configurationBase = {
    value: '',
    lineNumbers: true,
    theme: 'blackboard',
    lineWrapping: false,
    indentUnit: 4,
}

export class EditorBottomNavView implements VirtualDOM {
    public readonly appState: AppState
    public readonly run$ = new Subject<string>()
    public readonly content$: BehaviorSubject<string>
    public readonly onRun: (content: string) => void
    public readonly requirements: {
        scripts: string[]
        css: string[]
    }
    public readonly configuration
    public readonly class = 'd-flex'
    public readonly children: VirtualDOM[]

    constructor(params: {
        appState: AppState
        content$: BehaviorSubject<string>
        onRun: (content: string) => void
        configuration
        requirements: {
            scripts: string[]
            css: string[]
        }
    }) {
        Object.assign(this, params)
        const editor = new CodeEditorView({
            appState: this.appState,
            code: {
                headerView: () => ({}),
                content$: this.content$,
                configuration: {
                    ...this.configuration,
                    extraKeys: {
                        'Ctrl-Enter': () => {
                            this.onRun(this.content$.getValue())
                        },
                    },
                },
                requirements: this.requirements,
            },
        })
        this.run$.subscribe((content) => this.onRun(content))
        this.children = [
            {
                class: 'h-100 p-1',
                children: [
                    {
                        tag: 'i',
                        class: 'fv-pointer rounded m-1 fas fa-play fv-hover-text-focus',
                        onclick: () => this.run$.next(this.content$.getValue()),
                    },
                ],
            },
            editor,
        ]
    }
}

export class CssEditor extends EditorBottomNavView {
    constructor({
        appState,
        content$,
        onRun,
    }: {
        appState
        content$
        onRun: (content: string) => void
    }) {
        super({
            appState: appState,
            content$,
            configuration: {
                ...configurationBase,
                mode: 'text/css',
            },
            requirements: {
                scripts: ['codemirror#5.52.0~mode/css.min.js'],
                css: [],
            },
            onRun,
        })
    }
}

export class JsEditor extends EditorBottomNavView {
    constructor({
        appState,
        content$,
        onRun,
    }: {
        appState
        content$
        onRun: (content: string) => void
    }) {
        super({
            appState: appState,
            content$,
            configuration: {
                ...configurationBase,
                mode: 'javascript',
            },
            requirements: {
                scripts: [
                    'codemirror#5.52.0~mode/javascript.min.js',
                    'codemirror#5.52.0~mode/css.min.js',
                    'codemirror#5.52.0~mode/xml.min.js',
                    'codemirror#5.52.0~mode/htmlmixed.min.js',
                ],
                css: [],
            },
            onRun,
        })
    }
}
