import { render } from "@youwol/flux-view"
import { Button } from "@youwol/fv-button"
import { Modal } from "@youwol/fv-group"
import { TextInput } from "@youwol/fv-input"
import { BehaviorSubject, merge, Subject } from "rxjs"
import { map } from "rxjs/operators"


function rowView(
    name: string, 
    text$: BehaviorSubject<string>,
    id: string
    ){
    let state = new TextInput.State(text$)
    let view = new TextInput.View({state, class:'col'} as any)
    return {
        id,
        class: 'row my-4 ',
        children:[
            {
                tag: 'span',
                class: 'col',
                innerText: name
            },
            view
        ]
    }
}
export function popupSelectModuleView$({
    ok$
}: {
    ok$?: Subject<MouseEvent>
} = {}
){

    let fluxPackName$ = new BehaviorSubject<string>("@youwol/flux-three")
    let moduleId$ = new BehaviorSubject<string>("ModuleSphere")

    let okBttn = new Button.View({
        state: new Button.State(),
        contentView: () => ({ innerText: 'Ok'}),
        class: "fv-btn fv-btn-primary fv-bg-focus mr-2"
    } as any)

    let modalState = new Modal.State(ok$)
    let modalDiv = render(
        new Modal.View({
            state: modalState,
            contentView: () => {
                return {
                    id:"modal-select-module",
                    class:'border rounded fv-text-primary fv-bg-background d-flex flex-column p-5',
                    children:[
                        {
                            children:[
                                rowView("Toolbox id", fluxPackName$, "toolbox-id"),
                                rowView("Brick id", moduleId$, "brick-id"),
                            ]
                        },
                        {
                            class:'d-flex p-2',
                            children:[
                                okBttn
                            ]
                        }
                    ]
                }
            },
            connectedCallback: (elem) => {
                let subs = [
                    okBttn.state.click$.subscribe( () => modalState.ok$.next()),
                    merge(modalState.cancel$, modalState.ok$ ).subscribe( () => modalDiv.remove() )
                ]
                elem.subscriptions = [...elem.subscriptions, ...subs]
            }
        }as any)
    )

    document.querySelector("body").appendChild(modalDiv)
    return modalState.ok$.pipe(
        map( () => {
            return {
                toolboxId:fluxPackName$.getValue(),
                brickId: moduleId$.getValue()
            }
        })
    )
}