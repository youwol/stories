import { BehaviorSubject, Subject } from "rxjs"
import { map } from "rxjs/operators"
import { rowView, simpleModal } from "./commons.view"


export function popupSelectToolboxView$({
    ok$
}: {
    ok$?: Subject<MouseEvent>
} = {}
) {

    let fluxPackName$ = new BehaviorSubject<string>("@youwol/flux-three")

    let modalState = simpleModal({
        rows: [rowView("Toolbox id", fluxPackName$, "toolbox-id")],
        ok$
    })

    return modalState.ok$.pipe(
        map(() => {
            return {
                toolboxId: fluxPackName$.getValue()
            }
        })
    )
}
