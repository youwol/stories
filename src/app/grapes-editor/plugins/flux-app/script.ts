import { VirtualDOM } from '@youwol/flux-view'
import { BehaviorSubject, ReplaySubject } from 'rxjs'

export function render() {
    type renderingMode = 'builder' | 'runner'

    const RenderModeUrls: Record<renderingMode, (id: string) => string> = {
        builder: (projectId) =>
            `/applications/@youwol/flux-builder/latest/?id=${projectId}`,
        runner: (projectId) =>
            `/applications/@youwol/flux-runner/latest/?id=${projectId}`,
    }

    class FluxAppView {
        static defaultClass = 'w-100 overflow-auto'
        public readonly appId: string
        public readonly class =
            'flux-app-view d-flex flex-column h-100 fv-text-primary fv-bg-background'
        public readonly children: VirtualDOM[]
        public readonly renderedIframe$: ReplaySubject<HTMLIFrameElement>
        public readonly reload$: BehaviorSubject<boolean>

        constructor(params: { appId: string }) {
            Object.assign(this, params)
            const { child$ } = window['@youwol/flux-view']
            const { ReplaySubject, BehaviorSubject } = window['rxjs']
            this.renderedIframe$ = new ReplaySubject<HTMLIFrameElement>(1)
            this.reload$ = new BehaviorSubject<HTMLIFrameElement>(true)
            this.children = [
                this.toolBarView(),
                child$(this.reload$, () => ({
                    id: params.appId,
                    class: 'flex-grow-1',
                    children: [
                        {
                            tag: 'iframe',
                            width: '100%',
                            height: '100%',
                            src: RenderModeUrls['runner'](params.appId),
                            connectedCallback: (iframe: HTMLIFrameElement) => {
                                this.renderedIframe$.next(iframe)
                            },
                        },
                    ],
                })),
            ]
        }

        toolBarView(): VirtualDOM {
            const commonClass = 'fas fv-pointer fv-hover-text-focus px-2'
            return {
                class: 'w-100 d-flex justify-content-center my-1',
                children: [
                    {
                        class: `fa-tools ${commonClass}`,
                        onclick: () => {
                            window.open(RenderModeUrls['builder'](this.appId))
                        },
                    },
                    {
                        class: `fa-sync ${commonClass}`,
                        onclick: () => {
                            this.reload$.next(true)
                        },
                    },
                ],
            }
        }
    }

    const renderDOM = () => {
        const { render } = window['@youwol/flux-view']
        const vDOM = new FluxAppView({
            appId: atob(this.getAttribute('app')),
        })
        this.appendChild(render(vDOM))
    }
    if (window['@youwol/flux-view']) {
        renderDOM()
        return
    }

    const cdnClient = window['@youwol/cdn-client']
    cdnClient.install({ modules: ['@youwol/flux-view'] }).then(() => {
        renderDOM()
    })
}
