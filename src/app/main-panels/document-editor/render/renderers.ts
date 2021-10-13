import { render, VirtualDOM } from '@youwol/flux-view';
import { parse } from 'marked'
import { FluxAppView } from './youwol-views/flux-app.view';


export interface RenderableTrait {

    render(element: HTMLElement, documentScope: {[key:string]: unknown}): Promise<HTMLElement>
}


export class MarkDownRenderer implements RenderableTrait {

    render(htmlElement: HTMLElement): Promise<HTMLElement> {

        htmlElement.innerHTML = parse(htmlElement.innerHTML)

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

    class = "w-100 d-flex fv-text-error"
    children: VirtualDOM[]

    constructor(params: {
        message: string
    }) {

        this.children = [
            {
                class: "fas fa-error youwol-view-error"
            },
            {
                innerText: params.message
            }
        ]
    }
}


export class YouwolRenderer implements RenderableTrait {


    render(htmlElement: HTMLElement, documentScope: {[key:string]: unknown}): Promise<HTMLElement> {

        let youwolViews = htmlElement.querySelectorAll(".language-youwol-view")
        youwolViews.forEach((fluxAppBlock: HTMLDivElement) => {
            let vDOM
            try {
                let code = sanitizeCodeScript(fluxAppBlock.innerHTML)
                vDOM = new Function(code)()({
                    youwol: { FluxAppView },
                    documentScope
                })
            }
            catch (error) {
                let errorView = new ErrorView({
                    message: `An error ocurred while parsing the configuration:\n${fluxAppBlock.innerText}`
                })
                fluxAppBlock.replaceWith(render(errorView))
                return
            }
            fluxAppBlock.replaceWith(render(vDOM))
        })
        return Promise.resolve(htmlElement)
    }
}



export function sanitizeCodeScript(text: string) {
    return text.replace(/&gt;/g, '>').replace(/&amp;gt;/g,">")
}

