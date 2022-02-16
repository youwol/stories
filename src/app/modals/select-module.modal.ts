import { BehaviorSubject, Subject } from 'rxjs'
import { map } from 'rxjs/operators'
import { rowView, simpleModal } from './commons.view'

export function popupSelectModuleView$({
    ok$,
}: {
    ok$?: Subject<MouseEvent>
} = {}) {
    const fluxPackName$ = new BehaviorSubject<string>('@youwol/flux-three')
    const moduleId$ = new BehaviorSubject<string>('ModuleSphere')
    const modalState = simpleModal({
        rows: [
            rowView('Toolbox id', fluxPackName$, 'toolbox-id'),
            rowView('Brick id', moduleId$, 'brick-id'),
        ],
        ok$,
    })
    return modalState.ok$.pipe(
        map(() => {
            return {
                toolboxId: fluxPackName$.getValue(),
                brickId: moduleId$.getValue(),
            }
        }),
    )
}
