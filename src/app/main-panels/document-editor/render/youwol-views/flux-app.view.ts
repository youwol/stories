import { attr$, child$, VirtualDOM } from "@youwol/flux-view"
import { BehaviorSubject, ReplaySubject } from "rxjs"

/**
 * Option of rendering mode
 */
export enum RenderMode {
    Runner = "runner",      //!< only the running application
    Workflow = "workflow",  //!< only the workflow
    Builder = "builder"     //!< builder mode
}

let RenderModeUrls = {
    [RenderMode.Runner]: (projectId) => `/ui/flux-runner/?id=${projectId}`,
    [RenderMode.Workflow]: (projectId) => `/ui/flux-runner/?id=${projectId}`,
    [RenderMode.Builder]: (projectId) => `/ui/flux-builder/?id=${projectId}`
}

let RenderModeClass = {
    [RenderMode.Runner]: 'fas fa-play',
    [RenderMode.Workflow]: 'fas fa-sitemap',
    [RenderMode.Builder]: 'fas fa-tools'
}


function toolBarModeView(
    faClasses: string,
    targetMode: RenderMode,
    selectedMode$: BehaviorSubject<string>
) {

    return {
        class: attr$(
            selectedMode$,
            (mode) => mode == targetMode
                ? 'fv-text-focus'
                : 'fv-text-primary',
            {
                wrapper: (classes) => classes + " fv-pointer mx-2 tool-bar-mode-view " + targetMode
            }
        ),
        children: [
            {
                class: faClasses
            }
        ],
        onclick: () => selectedMode$.next(targetMode)
    }
}

function toolBarButton(params: {
    class: string,
    faClasses: string,
    onclick: () => void
}) {

    return {
        class: 'px-2 fv-pointer ' + params.class,
        children: [
            {
                class: params.faClasses
            }
        ],
        onclick: () => params.onclick()
    }
}

/**
 * Flux application view
 * 
 * It displays the a flux application in either running mode, builder mode or
 * workflow mode. A toolbar allows to switch between the modes. Options
 * for full-screen mode as well as opening in new tab are provided.
 */
export class FluxAppView implements VirtualDOM {

    static defaultClass = 'w-100 overflow-auto'

    public readonly projectId: string
    public readonly wrapperDiv: {
        class?: string,
        style?: { [key: string]: string }
    }
    public readonly modes: string[]

    public readonly class = 'flux-app-view'
    public readonly style: { [key: string]: string } = {}

    public readonly selectedMode$ = new BehaviorSubject<RenderMode>(RenderMode.Runner)
    public readonly children: VirtualDOM[]

    public readonly renderedIframe$ = new ReplaySubject<HTMLIFrameElement>(1)
    constructor(params: {
        projectId: string
        wrapperDiv?: {
            class?: string,
            style?: { [key: string]: string }
        },
        modes: string[]
    }) {
        Object.assign(this, params)


        let iframeParentClass = params.wrapperDiv && params.wrapperDiv.class
            ? params.wrapperDiv.class
            : FluxAppView.defaultClass
        let iframeParentStyle = params.wrapperDiv && params.wrapperDiv.style
            ? params.wrapperDiv.style
            : {}

        this.children = [
            this.fluxAppToolBarView(),
            {
                class: iframeParentClass,
                style: iframeParentStyle,
                id: params.projectId,
                children: [
                    child$(
                        this.selectedMode$,
                        (mode: RenderMode) => {
                            return {
                                tag: 'iframe',
                                width: '100%',
                                height: '100%',
                                src: RenderModeUrls[mode](params.projectId),
                                connectedCallback: (iframe: HTMLIFrameElement) => {
                                    this.renderedIframe$.next(iframe)
                                }
                            }
                        }
                    )
                ]
            }
        ]
    }

    fluxAppToolBarView() {
        return {
            class: 'w-100 d-flex justify-content-center my-1',
            children: [
                {
                    class: 'd-flex mx-4 align-items-center',
                    children: this.modes.map((mode: RenderMode) => {
                        return toolBarModeView(RenderModeClass[mode], mode, this.selectedMode$)
                    })
                },
                {
                    class: 'd-flex mx-4  align-items-center',
                    children: [
                        child$(
                            this.renderedIframe$,
                            (iframe) => {
                                return toolBarButton({
                                    class: "request-full-screen",
                                    faClasses: 'fas fa-expand',
                                    onclick: () => iframe.requestFullscreen()
                                })
                            }
                        ),
                        toolBarButton({
                            class: "window-open-url",
                            faClasses: 'fas fa-external-link-alt',
                            onclick: () => {
                                window.open(RenderModeUrls[this.selectedMode$.getValue()](this.projectId), '_blank').focus();
                            }
                        }),
                    ]
                }
            ]
        }
    }
}
