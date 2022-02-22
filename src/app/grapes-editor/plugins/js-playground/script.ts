import { HTMLElement$, Stream$, VirtualDOM } from '@youwol/flux-view'
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs'

export function render() {
    const defaultStartingSrc = `
return async ({debug}) => {
    
    const jsObject = { 
        title: 'hello js playground!'
    }
    debug({title: 'jsObject', data: jsObject})
    
    const div = document.createElement('div')
    div.innerText = "I'm an html div"
    div.classList.add('fv-text-focus', 'text-center', 'p-1', 'border', 'rounded')
    debug({title: 'htmlElement', data: div})
    
    return true
}
`
    const defaultTest = `
return async (result, {expect}) => {
    expect("A dummy passing test", true)
    return true
}
`

    const startingSrc = this.getAttribute('src') || defaultStartingSrc
    const testSrc = this.getAttribute('src-test') || defaultTest
    console.log({ startingSrc })
    type LogableObject = Record<string, unknown>

    interface Log {
        title: string
        data: HTMLElement | LogableObject
    }

    class CodeEditorView {
        public readonly config = {
            value: '',
            mode: 'javascript',
            lineNumbers: true,
            theme: 'blackboard',
            lineWrapping: true,
            indentUnit: 4,
        }

        public readonly class = 'w-50 h-100 d-flex flex-column'
        public readonly style = {
            'font-size': 'initial',
        }
        public readonly src$: BehaviorSubject<string>
        public readonly run$: Subject<boolean>
        public readonly children: VirtualDOM[]

        constructor(params: {
            src$: BehaviorSubject<string>
            run$: Subject<boolean>
        }) {
            Object.assign(this, params)
            const { CodeMirror } = window as any
            this.children = [
                {
                    class: 'w-100 d-flex justify-content-center',
                    children: [
                        {
                            tag: 'i',
                            class: 'fv-pointer rounded m-1 fas fa-play fv-hover-text-focus',
                            onclick: () => this.run$.next(true),
                        },
                    ],
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
                                const editor = CodeMirror(elem, {
                                    ...this.config,
                                    value: this.src$.getValue(),
                                })
                                editor.on('changes', (_, changeObj) => {
                                    if (
                                        changeObj.length == 1 &&
                                        changeObj[0].origin == 'setValue'
                                    ) {
                                        return
                                    }
                                    this.src$.next(editor.getValue())
                                })
                                document
                                    .querySelector('.CodeMirror-wrap')
                                    .classList.add('h-100')
                            },
                        },
                    ],
                },
            ]
        }
    }

    function objectJsView(object) {
        const { fvTree } = window as any
        const state = new fvTree.ObjectJs.State({
            title: 'data',
            data: object,
            expandedNodes: ['data_0'],
        })
        return new fvTree.ObjectJs.View({ state })
    }

    class DataView {
        public readonly class = 'py-2'
        public readonly innerText: string
        public readonly log: LogableObject
        public readonly children: VirtualDOM[]

        constructor(params: { log: LogableObject }) {
            Object.assign(this, params)
            console.log('Data view', this.log)
            const child =
                this.log.data instanceof HTMLElement
                    ? this.log.data
                    : objectJsView(this.log.data)

            this.children = [child]
        }
    }

    class OutputView {
        public readonly output?: LogableObject
        public readonly children: VirtualDOM[]

        constructor(params: { output: LogableObject }) {
            Object.assign(this, params)
            const { rxjs } = window as any
            const log = { title: 'output', data: this.output }
            this.children = [
                {
                    class: 'd-flex justify-content-center',
                    children: [
                        this.output
                            ? new LogObjectHeader({
                                  log,
                                  selectedLog$: rxjs.of(this.output),
                              })
                            : { innerText: 'no result returned' },
                    ],
                },
                new DataView({ log }),
            ]
        }
    }

    class LogObjectHeader {
        public readonly baseClass =
            'px-2 py-1 border-bottom fv-pointer fv-hover-text-focus mx-1'
        public readonly class: string
        public readonly log: Log
        public readonly children: VirtualDOM[]
        public readonly style = {
            width: 'fit-content',
        }

        public readonly selectedLog$: Subject<Log>
        public readonly onclick = () => {
            this.selectedLog$.next(this.log)
        }

        constructor(params: { log: Log; selectedLog$: Subject<Log> }) {
            Object.assign(this, params)
            const { fluxView, rxjs } = window as any
            this.class = fluxView.attr$(
                this.selectedLog$,
                (log) => (log.title == this.log.title ? 'fv-text-focus ' : ''),
                {
                    wrapper: (d) => `${d} ${this.baseClass}`,
                    untilFirst: this.baseClass,
                },
            )
            this.children = [
                {
                    tag: 'i',
                    class:
                        this.log.data instanceof HTMLElement
                            ? 'fas fa-code mx-2'
                            : 'fas fa-sitemap mx-2',
                },
                {
                    tag: 'i',
                    innerText: this.log.title,
                },
            ]
        }
    }

    class DebugView {
        public readonly log$: Observable<Log>
        public readonly children: VirtualDOM[]
        public readonly selectedLog$: Subject<Log>

        constructor(params: { log$: Observable<Log> }) {
            Object.assign(this, params)
            const { fluxView, rxjs } = window as any
            this.selectedLog$ = new rxjs.Subject()

            this.children = [
                {
                    class: 'd-flex flex-wrap justify-content-center',
                    children: fluxView.childrenAppendOnly$(
                        this.log$.pipe(rxjs.operators.map((d) => [d])),
                        (log: Log) => {
                            return new LogObjectHeader({
                                log,
                                selectedLog$: this.selectedLog$,
                            })
                        },
                    ),
                },
                {
                    class: 'flex-grow-1',
                    children: [
                        fluxView.child$(
                            this.selectedLog$,
                            (log) => new DataView({ log }),
                        ),
                    ],
                },
            ]
        }
    }

    class TestItemView {
        public readonly class = 'd-flex align-items-center'
        public readonly children: VirtualDOM[]
        public readonly title: string
        public readonly validated: boolean

        constructor(params: { title: string; validated: boolean }) {
            Object.assign(this, params)
            this.children = [
                {
                    class: this.validated
                        ? 'fas fa-check fv-text-success'
                        : 'fas fa-times fv-text-error',
                },
                { class: 'px-2', innerText: this.title },
            ]
        }
    }

    class TestView {
        public readonly testSrc: string
        public readonly output: unknown
        public readonly children: VirtualDOM[]
        public readonly expect$: ReplaySubject<{
            title: string
            validated: boolean
        }>

        constructor(params: { testSrc: string; output: unknown }) {
            Object.assign(this, params)
            const { fluxView, rxjs } = window as any
            this.expect$ = new rxjs.ReplaySubject()
            const expect = (title, validated) => {
                console.log('Expect', { title, validated })
                this.expect$.next({ title, validated })
            }
            console.log('testSrc', this.testSrc)
            const output$ = rxjs.from(
                new Function(this.testSrc)()(this.output, {
                    ...window,
                    expect,
                }),
            )
            this.children = [
                {
                    children: fluxView.childrenAppendOnly$(
                        this.expect$.pipe(rxjs.operators.map((d) => [d])),
                        ({ title, validated }) => {
                            return new TestItemView({ title, validated })
                        },
                    ),
                },
            ]
        }
    }

    type ModeConsole = 'output' | 'debug' | 'test'
    const iconsHeader: Record<ModeConsole, string> = {
        output: 'fa-eye ',
        debug: 'fa-bug',
        test: 'fa-check',
    }

    class IconHeaderConsole {
        public readonly tag = 'i'
        public readonly class: Stream$<ModeConsole, string>
        public readonly children: VirtualDOM[]
        public readonly mode$: Subject<ModeConsole>
        public readonly target: ModeConsole
        public readonly onclick = () => {
            this.mode$.next(this.target)
        }

        constructor(params: {
            target: ModeConsole
            mode$: Subject<ModeConsole>
        }) {
            Object.assign(this, params)
            const { fluxView } = window as any
            const baseClasses = `fv-pointer rounded m-1 fas fv-hover-text-focus mx-2 ${
                iconsHeader[this.target]
            }`
            this.class = fluxView.attr$(
                this.mode$,
                (mode: ModeConsole) => {
                    return mode == this.target
                        ? 'fv-bg-background fv-text-focus'
                        : ''
                },
                {
                    wrapper: (d) => `${baseClasses} ${d}`,
                },
            )
        }
    }

    class HeaderConsole {
        public readonly class = 'd-flex justify-content-center'
        public readonly children: VirtualDOM[]
        public readonly mode$: BehaviorSubject<ModeConsole>

        constructor(params: { mode$: Subject<ModeConsole> }) {
            Object.assign(this, params)
            const { rxjs } = window as any

            this.children = [
                new IconHeaderConsole({ target: 'output', mode$: this.mode$ }),
                new IconHeaderConsole({ target: 'debug', mode$: this.mode$ }),
                new IconHeaderConsole({ target: 'test', mode$: this.mode$ }),
            ]
        }
    }

    class ConsoleView {
        public readonly class = 'w-50 h-100 px-2'
        public readonly src: string
        public readonly testSrc: string
        public readonly log$: ReplaySubject<Log>
        public readonly children: VirtualDOM[]
        public readonly mode$: Subject<ModeConsole>

        constructor(params: {
            src: string
            mode$: Subject<ModeConsole>
            testSrc: string
        }) {
            Object.assign(this, params)
            const { fluxView, rxjs } = window as any

            this.log$ = new rxjs.ReplaySubject()

            const debug = (message: { title: string; data: LogableObject }) => {
                console.log('Debug!!', message)
                this.log$.next(message)
            }
            console.log({ src: this.src })
            const output$ = rxjs.from(
                new Function(this.src)()({ ...window, debug }),
            )

            this.children = [
                new HeaderConsole({ mode$: this.mode$ }),
                fluxView.child$(
                    rxjs.combineLatest([this.mode$, output$]),
                    ([mode, output]: [
                        mode: ModeConsole,
                        output: LogableObject,
                    ]) => {
                        if (mode == 'output') {
                            return new OutputView({ output })
                        }
                        if (mode == 'debug') {
                            return new DebugView({ log$: this.log$ })
                        }
                        if (mode == 'test') {
                            return new TestView({
                                testSrc: this.testSrc,
                                output,
                            })
                        }
                    },
                ),
            ]
        }
    }

    class PlaygroundView {
        public readonly appId: string
        public readonly class =
            'd-flex fv-text-primary fv-bg-background w-100 h-100 overflow-auto p-2'
        public readonly children: VirtualDOM[]
        public readonly src$: BehaviorSubject<string>

        public readonly startingSrc: string
        public readonly testSrc: string
        public readonly run$: Subject<boolean>

        public readonly mode$: BehaviorSubject<ModeConsole>

        constructor(params: { startingSrc: string; testSrc: string }) {
            Object.assign(this, params)
            const { rxjs, fluxView } = window as any

            this.mode$ = new rxjs.BehaviorSubject('output')
            this.src$ = new rxjs.BehaviorSubject(this.startingSrc)
            this.run$ = new rxjs.Subject()

            this.children = [
                new CodeEditorView({ src$: this.src$, run$: this.run$ }),
                fluxView.child$(
                    this.run$.pipe(rxjs.operators.withLatestFrom(this.src$)),
                    ([_, src]) =>
                        new ConsoleView({
                            src,
                            mode$: this.mode$,
                            testSrc: this.testSrc,
                        }),
                ),
            ]
        }
    }

    const renderDOM = () => {
        const { render } = window['@youwol/flux-view']

        const vDOM = new PlaygroundView({
            startingSrc,
            testSrc,
        })
        this.appendChild(render(vDOM))
    }
    if (window['@youwol/fv-tree'] && window['codemirror']) {
        renderDOM()
        return
    }

    const cdnClient = window['@youwol/cdn-client']
    cdnClient
        .install({
            modules: ['@youwol/fv-tree', 'codemirror'],
            scripts: ['codemirror#5.52.0~mode/javascript.min.js'],
            css: [
                'codemirror#5.52.0~codemirror.min.css',
                'codemirror#5.52.0~theme/blackboard.min.css',
            ],
            aliases: {
                fluxView: '@youwol/flux-view',
                fvTree: '@youwol/fv-tree',
            },
        })
        .then(() => {
            renderDOM()
        })
}
