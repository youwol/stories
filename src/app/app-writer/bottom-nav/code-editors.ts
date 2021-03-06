import { CodeEditorView } from '../code-editor'
import { BehaviorSubject, Subject } from 'rxjs'
import { VirtualDOM } from '@youwol/flux-view'
import { AppState } from '../app-state'
import { Code } from '../models'
import { CodeRequirements } from '../../common'

/**
 * @category Configuration
 */
const configurationBase = {
    value: '',
    lineNumbers: true,
    theme: 'blackboard',
    lineWrapping: false,
    indentUnit: 4,
}

/**
 * @category View
 * @category Getting Started
 */
export class EditorBottomNavView implements VirtualDOM {
    /**
     * @group States
     */
    public readonly appState: AppState

    /**
     * @group Observables
     */
    public readonly run$ = new Subject<string>()

    /**
     * @group Observables
     */
    public readonly content$: BehaviorSubject<string>

    /**
     * @group Immutable Constants
     */
    public readonly onRun: (content: string) => void

    /**
     * @group Immutable Constants
     */
    public readonly requirements: {
        scripts: string[]
        css: string[]
    }

    /**
     * @group Immutable Constants
     */
    public readonly configuration

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'd-flex h-100'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(params: {
        appState: AppState
        content$: BehaviorSubject<string>
        onRun: (content: string) => void
        configuration
        requirements: CodeRequirements
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

/**
 * @category View
 */
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

/**
 * @category View
 */
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

/**
 * @category View
 */
export class CustomEditor extends CodeEditorView {
    constructor({
        appState,
        settings,
    }: {
        appState: AppState
        settings: Code
    }) {
        super({
            appState: appState,
            code: settings,
        })
    }
}
