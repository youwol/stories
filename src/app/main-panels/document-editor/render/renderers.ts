import { attr$, child$, render, VirtualDOM } from '@youwol/flux-view';
import { parse, setOptions } from 'marked'
import hljs from "highlight.js";
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

setOptions({
    langPrefix: "hljs language-",
    highlight: function (code, lang) {
        return hljs.highlightAuto(code, [lang]).value;
    }
});

export interface RenderableTrait {

    render(element: HTMLElement, documentScope: { [key: string]: unknown }): Promise<HTMLElement>
}


export class MarkDownRenderer implements RenderableTrait {

    render(htmlElement: HTMLElement): Promise<HTMLElement> {

        htmlElement.innerHTML = parse(sanitizeCodeScript(htmlElement.innerHTML))
        return Promise.resolve(htmlElement);
    }
}

export class MathJaxRenderer implements RenderableTrait {

    /**
     * see https://docs.mathjax.org/en/latest/web/typeset.html
     */
    private promise: any = Promise.resolve()


    render(htmlElement: HTMLElement): Promise<HTMLElement> {
        let promise = this.promise
            .then(() => {
                window['MathJax'].typesetPromise([htmlElement])
                return htmlElement
            })
        this.promise = promise
        return promise
    }
}


class ErrorView implements VirtualDOM {

    class = "w-100 d-flex fv-text-error youwol-view-error"
    children: VirtualDOM[]

    constructor(params: {
        message: string
    }) {

        this.children = [
            {
                class: "fas fa-error"
            },
            {
                class: "message",
                innerText: params.message
            }
        ]
    }
}

enum Mode {
    view = "view",
    code = "code"
}
export class StoryView implements VirtualDOM {

    public readonly children: VirtualDOM[]

    public readonly style: { [key: string]: string } = {}
    public readonly class: string = "w-100 d-flex story-view"

    public readonly mode$ = new BehaviorSubject(Mode.view)

    public readonly cdnScript: HTMLScriptElement = document.head.querySelector("script#cdn-client")
    public readonly bootstrapCss: HTMLScriptElement = document.head.querySelector("link#bootstrap")
    public readonly faCss: HTMLScriptElement = document.head.querySelector("link#fa")
    public readonly fvCss: HTMLScriptElement = document.head.querySelector("link#fv")

    constructor(public readonly code: string) {
        // test that the code is semantically OK to avoid latter failure
        // an error will be catch appropriately and the error view displayed
        this.runCode()

        this.children = [
            this.menuView(),
            {
                class: 'flex-grow-1',
                children: [
                    this.iFrameView(),
                    child$(
                        this.mode$.pipe(filter(mode => mode == Mode.code)),
                        () => this.codeView()
                    )
                ]
            }
        ]
    }

    private runCode() {
        return new Function(this.code)()
    }

    menuView(): VirtualDOM {
        let classes = ' fas p-2 border rounded fv-pointer '
        return {
            class: "h-100 d-flex flex-column fv-bg-background-alt menu-view",
            children: [
                {
                    class: attr$(
                        this.mode$,
                        (selected) => selected == Mode.view ? 'fv-text-focus' : '',
                        { wrapper: (d) => d + classes + 'fa-eye mode-iframe', }
                    ),
                    onclick: () => this.mode$.next(Mode.view)
                },
                {
                    class: attr$(
                        this.mode$,
                        (selected) => selected == Mode.code ? 'fv-text-focus' : '',
                        { wrapper: (d) => d + classes + 'fa-code mode-code', }
                    ),
                    onclick: () => this.mode$.next(Mode.code)
                }
            ]
        }
    }

    codeView(): VirtualDOM {

        let config = {
            value: this.code,
            mode: 'javascript',
            lineNumbers: false,
            theme: 'blackboard',
            lineWrapping: true,
            readOnly: true
        }

        return {
            class: attr$(
                this.mode$,
                (mode) => mode == Mode.view ? "d-none" : "",
                { wrapper: (d) => d + " w-100 h-100 code-view" }
            ),
            style: {
                maxHeight: '500px'
            },
            connectedCallback: (elem) => {
                window['CodeMirror'](elem, config)
            }
        }
    }


    iFrameView(): VirtualDOM {

        return {
            tag: 'iframe',
            class: attr$(
                this.mode$,
                (mode) => mode == Mode.code ? "d-none" : "",
                { wrapper: (d) => d + " iframe-view" }
            ),
            connectedCallback: (iframe: HTMLIFrameElement) => {
                let window = iframe.contentWindow
                let document = window.document
                let head = document.head
                head.appendChild(this.bootstrapCss.cloneNode())
                head.appendChild(this.faCss.cloneNode())
                head.appendChild(this.fvCss.cloneNode())
                head.appendChild(this.fvCss.cloneNode())
                let script = document.createElement("script") as any
                script.src = this.cdnScript.src
                script.async = true
                script.addEventListener('load', () => {
                    window['cdn'] = window['@youwol/cdn-client']
                    this.resolveView(window, iframe)
                });
                head.appendChild(script)
            }
        }
    }

    resolveView(executingWindow: Window, wrapper: HTMLElement): Promise<void> {

        let userObjectOrPromise = this.runCode()(executingWindow)

        if (userObjectOrPromise instanceof executingWindow['Promise']) {
            let promise = userObjectOrPromise
            return promise.then((object) => {
                this.appendView(object, wrapper, executingWindow.document.body)
            })
        }
        else {
            let object = userObjectOrPromise
            return Promise.resolve(this.appendView(object, wrapper, executingWindow.document.body))
        }
    }

    appendView(
        userObject: HTMLElement | { view: HTMLElement, options: any },
        wrapper: HTMLElement,
        container: HTMLElement
    ) {
        let view = (userObject as any).view ? (userObject as any).view : userObject
        let options = (userObject as any).options ? (userObject as any).options : {}

        let style = options['wrapper']?.style || {}
        let classes = options['wrapper']?.class || ""

        Object.entries(style).forEach(([name, value]) => {
            wrapper.style.setProperty(name, value as any)
        })
        classes != "" && wrapper.classList.add(classes.split(" "))

        container.classList.add("fv-bg-background", "fv-text-primary")
        container.appendChild(view)
    }
}

export class YouwolRenderer implements RenderableTrait {


    render(htmlElement: HTMLElement, documentScope: { [key: string]: unknown }): Promise<HTMLElement> {

        let youwolViews = Array.from(htmlElement.querySelectorAll(".language-javascript"))
            .filter((block: HTMLDivElement) => block.textContent.startsWith("//@story-view"))

        youwolViews.forEach((fluxAppBlock: HTMLDivElement) => {
            type View = HTMLElement | VirtualDOM
            let view: View | Promise<View>

            let code = sanitizeCodeScript(fluxAppBlock.textContent)
            try {
                view = new StoryView(code)
            }
            catch (error) {
                let errorView = new ErrorView({
                    message: `An error ocurred while parsing the configuration:\n${code}`
                })
                view = errorView
            }
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
    return text.replace(/&gt;/g, '>').replace(/&amp;gt;/g, ">")
}

