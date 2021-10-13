import { flattenSchemaWithValue, Factory } from "@youwol/flux-core"
import { child$, HTMLElement$, VirtualDOM } from "@youwol/flux-view"
import { AutoForm } from '@youwol/flux-fv-widgets'
import { ReplaySubject } from "rxjs"
import { map } from "rxjs/operators"
import { fetchResources$ } from "../../../../utils/cdn-fetch"

/**
 * Module's settings view.
 * 
 * It displays an automatically generated form based on the schema defined for the persistent data.
 * 
 */
export class ModuleSettingsView implements VirtualDOM{

    public readonly toolboxName : string
    public readonly brickId : string 
    public readonly version = "latest"
    public readonly bundleLoaded$ = new ReplaySubject<boolean>(1)
    public readonly class = 'flux-module-settings-view'
    public readonly style: {[key:string]:string} = {}
    public readonly children : VirtualDOM[]
    public readonly renderedElement$ = new ReplaySubject<HTMLDivElement>(1)

    connectedCallback : (elem: HTMLElement$ & HTMLDivElement) => void

    constructor( params: {
        toolboxName: string,
        brickId: string,
        version?: string
    }){
        Object.assign(this, params)
        
        this.children = [
            child$(
                fetchResources$({
                    bundles: {
                        [this.toolboxName] : this.version
                    },
                    urlsCss: [],
                    urlsJsAddOn:[]
                }).pipe(
                    map( () => window[this.toolboxName][this.brickId]),
                    map( (mdleFactory: Factory) => new mdleFactory.PersistentData() )
                ),
                (persistentData) => {
                    return this.autoFormView(persistentData)
                }
            )
        ]
    }

    autoFormView(persistentData: unknown) {

        let schemaWithValue = flattenSchemaWithValue(persistentData)
        let input = Object.keys(schemaWithValue)
        .map( k => ({[k]:schemaWithValue[k][0]}) )
        .reduce( (acc,e) =>({...acc, ...e}), {})

        let state = new AutoForm.State(
            persistentData, 
            input,
            () => true
            )
            
        return {
            class:'fv-bg-background fv-text-primary h-100 d-flex flex-column',
            children:[
                new AutoForm.View({
                    state, 
                    class:'flex-grow-1 overflow-auto', 
                    style:{'min-height':'0px'}
                } as any)
            ],
            connectedCallback : (autoFormView: HTMLDivElement) => {
                this.renderedElement$.next(autoFormView)
            }
        }
    }

}
