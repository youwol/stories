import { VirtualDOM } from '@youwol/flux-view'

export function render() {
    const toolbox = this.getAttribute('toolbox')
    const module = this.getAttribute('module')
    const version = this.getAttribute('version') || 'latest'

    if (!toolbox || !module) {
        this.innerHTML = '<i> Please provide toolbox & module names</i>'
        return
    }

    class ToolboxNotFound {
        constructor(public readonly toolbox) {}
    }

    class ModuleNotFound {
        constructor(public readonly module) {}
    }

    class ModuleSettingsView {
        public readonly toolbox: string
        public readonly module: string
        public readonly version = 'latest'
        public readonly class = 'flux-module-settings-view'
        public readonly style: { [key: string]: string } = {}
        public readonly children: VirtualDOM[]

        constructor(params: {
            toolbox: string
            module: string
            version?: string
        }) {
            Object.assign(this, params)

            const { fluxView, rxjs } = window as any
            this.children = [
                fluxView.child$(
                    rxjs
                        .from(
                            // to allow mocking :/ (should have been import { install } from '@youwol/cdn-client')
                            window['@youwol/cdn-client']
                                .install({
                                    modules: [
                                        {
                                            name: this.toolbox,
                                            version: this.version,
                                        },
                                    ],
                                })
                                .catch(() => new ToolboxNotFound(this.toolbox)),
                        )
                        .pipe(
                            rxjs.operators.map((d) =>
                                d instanceof ToolboxNotFound
                                    ? d
                                    : window[this.toolbox][this.module],
                            ),
                            rxjs.operators.map((factory: any) => {
                                if (factory instanceof ToolboxNotFound) {
                                    return factory
                                }
                                if (factory == undefined) {
                                    return new ModuleNotFound(this.module)
                                }
                                return new factory.PersistentData()
                            }),
                        ),
                    (persistentData) => {
                        if (persistentData instanceof ModuleNotFound) {
                            return {
                                tag: 'i',
                                innerText: `Module '${persistentData.module}' not found`,
                            }
                        }
                        if (persistentData instanceof ToolboxNotFound) {
                            return {
                                tag: 'i',
                                innerText: `Toolbox '${persistentData.toolbox}' not found`,
                            }
                        }
                        return this.autoFormView(persistentData)
                    },
                ),
            ]
        }

        autoFormView(persistentData: unknown) {
            const { fluxCore, fvWidgets } = window as any
            const schemaWithValue =
                fluxCore.flattenSchemaWithValue(persistentData)
            const input = Object.keys(schemaWithValue)
                .map((k) => ({ [k]: schemaWithValue[k][0] }))
                .reduce((acc, e) => ({ ...acc, ...e }), {})

            const state = new fvWidgets.AutoForm.State(
                persistentData,
                input,
                () => true,
            )

            return {
                class: 'fv-bg-background fv-text-primary h-100 d-flex flex-column',
                children: [
                    new fvWidgets.AutoForm.View({
                        state,
                        class: 'flex-grow-1 overflow-auto',
                        style: { 'min-height': '0px' },
                    }),
                ],
            }
        }
    }

    const renderDOM = () => {
        const { render } = window['@youwol/flux-view']
        const vDOM = new ModuleSettingsView({
            toolbox,
            module,
            version,
        })
        this.appendChild(render(vDOM))
    }
    if (
        window['@youwol/flux-view'] &&
        window['@youwol/flux-fv-widgets'] &&
        window['@youwol/flux-core']
    ) {
        renderDOM()
        return
    }

    const cdnClient = window['@youwol/cdn-client']
    cdnClient
        .install({
            modules: [
                '@youwol/flux-view',
                '@youwol/flux-fv-widgets',
                '@youwol/flux-core',
            ],
            aliases: {
                fluxCore: '@youwol/flux-core',
                fvWidgets: '@youwol/flux-fv-widgets',
                fluxView: '@youwol/flux-view',
            },
        })
        .then(() => {
            renderDOM()
        })
}
