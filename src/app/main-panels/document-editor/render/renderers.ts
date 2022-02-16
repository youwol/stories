import { attr$, child$, render, VirtualDOM } from '@youwol/flux-view'
import { parse, setOptions } from 'marked'
import hljs from 'highlight.js'
import { BehaviorSubject } from 'rxjs'

setOptions({
    langPrefix: 'hljs language-',
    highlight: function (code, lang) {
        return hljs.highlightAuto(code, [lang]).value
    },
})

export interface RenderableTrait {
    render(
        element: HTMLElement,
        documentScope: { [key: string]: unknown },
    ): Promise<HTMLElement>
}

export class MarkDownRenderer implements RenderableTrait {
    render(htmlElement: HTMLElement): Promise<HTMLElement> {
        /**
         * Not good as all innerHTML wil be sanitized while only code should be affected
         * https://github.com/markedjs/marked/issues/160
         * was not able to make it work
         */
        htmlElement.innerHTML = parse(sanitizeCodeScript(htmlElement.innerHTML))
        return Promise.resolve(htmlElement)
    }
}

export class MathJaxRenderer implements RenderableTrait {
    /**
     * see https://docs.mathjax.org/en/latest/web/typeset.html
     */
    private promise: any = Promise.resolve()

    render(htmlElement: HTMLElement): Promise<HTMLElement> {
        const promise = this.promise.then(() => {
            window['MathJax'].typesetPromise([htmlElement])
            return htmlElement
        })
        this.promise = promise
        return promise
    }
}

enum Mode {
    default = 'default',
    view = 'view',
    code = 'code',
    dual = 'dual',
}

export interface Options {
    wrapper?: {
        style?: { [key: string]: string }
        class?: string
    }
    defaultMode?: Mode
}

function storyViewComponent(definition: {
    package: string
    view: string
    parameters: any
    options: Options
}) {
    return ({ cdn }) => {
        return cdn
            .install({
                modules: [definition.package],
            })
            .then((window) => {
                const vDOM = new window[definition.package][definition.view](
                    definition.parameters,
                )
                return vDOM.renderStoryView(definition.options)
            })
    }
}

const functionsCatalog = {
    installFluxView: (cdn) =>
        cdn.install({
            modules: ['@youwol/flux-view'],
            aliases: {
                fluxView: '@youwol/flux-view',
            },
        }),
}

export class StoryView implements VirtualDOM {
    public readonly children: VirtualDOM[]

    public readonly style: { [key: string]: string } = {}
    public readonly class: string = 'w-100 d-flex story-view'

    public readonly mode$ = new BehaviorSubject(Mode.default)

    public readonly cdnScript: HTMLScriptElement =
        document.head.querySelector('script#cdn-client')
    public readonly bootstrapCss: HTMLScriptElement =
        document.head.querySelector('link#bootstrap')
    public readonly faCss: HTMLScriptElement =
        document.head.querySelector('link#fa')
    public readonly fvCss: HTMLScriptElement =
        document.head.querySelector('link#fv')

    constructor(public readonly code: string) {
        this.children = [
            this.menuView(),
            child$(this.mode$, (mode: Mode) => {
                switch (mode) {
                    case Mode.default:
                        return this.iFrameView()
                    case Mode.view:
                        return this.iFrameView()
                    case Mode.code:
                        return this.codeView()
                    case Mode.dual:
                        return {
                            class: 'd-flex justify-content-around w-100',
                            children: [
                                {
                                    class: 'p-2 w-100',
                                    children: [this.iFrameView()],
                                },
                                {
                                    class: 'p-2 w-100',
                                    children: [this.codeView()],
                                },
                            ],
                        }
                }
            }),
        ]
    }

    menuView(): VirtualDOM {
        const classes = ' fas p-2 border rounded fv-pointer '
        return {
            class: 'h-100 d-flex flex-column fv-bg-background-alt menu-view',
            children: [
                {
                    class: attr$(
                        this.mode$,
                        (selected) =>
                            selected == Mode.view ? 'fv-text-focus' : '',
                        { wrapper: (d) => d + classes + 'fa-eye mode-iframe' },
                    ),
                    onclick: () => this.mode$.next(Mode.view),
                },
                {
                    class: attr$(
                        this.mode$,
                        (selected) =>
                            selected == Mode.code ? 'fv-text-focus' : '',
                        { wrapper: (d) => d + classes + 'fa-code mode-code' },
                    ),
                    onclick: () => this.mode$.next(Mode.code),
                },
                {
                    class: attr$(
                        this.mode$,
                        (selected) =>
                            selected == Mode.dual ? 'fv-text-focus' : '',
                        {
                            wrapper: (d) =>
                                d + classes + 'fa-columns mode-dual',
                        },
                    ),
                    onclick: () => this.mode$.next(Mode.dual),
                },
            ],
        }
    }

    codeView(): VirtualDOM {
        const config = {
            value: this.code,
            mode: 'javascript',
            lineNumbers: true,
            theme: 'blackboard',
            lineWrapping: true,
            readOnly: true,
        }

        return {
            class: 'w-100 h-100 code-view',
            style: {
                maxHeight: '500px',
            },
            connectedCallback: (elem) => {
                window['CodeMirror'](elem, config)
            },
        }
    }

    iFrameView(): VirtualDOM {
        return {
            tag: 'iframe',
            style: {
                width: '100%',
                border: 'none',
                height: '50px',
                overflow: 'hidden',
            },
            class: 'iframe-view',
            connectedCallback: (iframe: HTMLIFrameElement) => {
                const window = iframe.contentWindow
                const document = window.document
                const head = document.head
                head.appendChild(this.bootstrapCss.cloneNode())
                head.appendChild(this.faCss.cloneNode())
                head.appendChild(this.fvCss.cloneNode())
                head.appendChild(this.fvCss.cloneNode())
                const script = document.createElement('script') as any
                script.src = this.cdnScript.src
                script.async = true
                script.onload = () => {
                    window['cdn'] = window['@youwol/cdn-client']
                    this.resolveView(window, iframe)
                }
                head.appendChild(script)
            },
        }
    }

    resolveView(executingWindow: Window, wrapper: HTMLElement): Promise<void> {
        let userObjectOrPromise
        try {
            let definition = new executingWindow['Function'](
                Object.keys(functionsCatalog),
                this.code,
            )(...Object.values(functionsCatalog))

            definition =
                typeof definition == 'function'
                    ? definition
                    : storyViewComponent(definition)

            userObjectOrPromise = definition(executingWindow)
        } catch (error) {
            this.appendErrorView(error, executingWindow.document.body, wrapper)
            return
        }
        if (userObjectOrPromise instanceof executingWindow['Promise']) {
            const promise = userObjectOrPromise
            return promise
                .then((object) => {
                    this.appendView(
                        object,
                        executingWindow.document.body,
                        wrapper,
                    )
                })
                .catch((error) => {
                    this.appendErrorView(
                        error,
                        executingWindow.document.body,
                        wrapper,
                    )
                })
        } else {
            const object = userObjectOrPromise
            return Promise.resolve(
                this.appendView(object, executingWindow.document.body, wrapper),
            )
        }
    }

    appendView(
        userObject: HTMLElement | { view: HTMLElement; options: any },
        container: HTMLElement,
        wrapper,
    ) {
        const view = (userObject as any).view
            ? (userObject as any).view
            : userObject
        const options = (userObject as any).options
            ? (userObject as any).options
            : {}

        const style = options['wrapper']?.style || {}
        const classes = options['wrapper']?.class || ''

        Object.entries(style).forEach(([name, value]) => {
            container.style.setProperty(name, value as any)
        })
        classes != '' &&
            container.classList.add(
                ...classes.split(' ').filter((item) => item != ''),
            )

        container.classList.add('fv-bg-background', 'fv-text-primary')
        container.appendChild(view)

        options.defaultMode &&
            Object.values(Mode).includes(options.defaultMode) &&
            this.mode$.getValue() == Mode.default &&
            this.mode$.next(options.defaultMode)

        wrapper.style.setProperty('height', container.scrollHeight + 20 + 'px')
    }

    appendErrorView(error: Error, container: HTMLElement, wrapper) {
        const stackView = error.stack
            ? {
                  tag: 'ul',
                  class: 'message',
                  children: error.stack
                      .split('\n')
                      .slice(1)
                      .map((line, i) => {
                          const title = line.split('(')[0]
                          const lineNbr = line
                              .split('<anonymous>')
                              .slice(-1)[0]
                              .split(':')[1]
                          return {
                              tag: 'li',
                              innerText: `${title} @line ${
                                  Number(lineNbr) - 2
                              }`,
                          }
                      }),
              }
            : {}

        const view = {
            error,
            class: 'w-100 fv-text-error story-view-error p-2',
            children: [
                {
                    class: 'fas fa-error',
                },
                {
                    class: 'message',
                    innerText: error.message,
                },
                stackView,
            ],
        }
        console.log(error)
        container.appendChild(render(view))

        wrapper.style.setProperty('height', container.scrollHeight + 20 + 'px')
    }
}

export class YouwolRenderer implements RenderableTrait {
    render(
        htmlElement: HTMLElement,
        documentScope: { [key: string]: unknown },
    ): Promise<HTMLElement> {
        const jsSnippets = Array.from(
            htmlElement.querySelectorAll('.language-javascript'),
        )
        const storyViews = jsSnippets.filter((block: HTMLDivElement) =>
            block.textContent.startsWith('//@story-view'),
        )

        storyViews.forEach((fluxAppBlock: HTMLDivElement) => {
            const view = new StoryView(fluxAppBlock.textContent)
            fluxAppBlock.replaceWith(render(view))
        })
        return Promise.resolve(htmlElement)
    }
}

/**
 * The output of code mirror contains some encoded characters;
 * e.g. '>' is '/&gt;/g'.
 * This function convert back to the original text.
 *
 * @param text the text to sanitize
 * @returns original text
 */
export function sanitizeCodeScript(text: string) {
    return text
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&')
}
