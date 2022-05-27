import { from } from 'rxjs'
import { install } from '@youwol/cdn-client'
import { CodeRequirements } from '../../common'

/**
 * Fetches code mirror's assets.
 *
 * @returns an observable that resolves when fetching is achieved
 */
export function fetchCodeMirror$(withInstall: CodeRequirements) {
    return from(
        install({
            modules: [...(withInstall?.modules || []), 'codemirror'],
            scripts: [...(withInstall?.scripts || [])],
            css: [
                'codemirror#5.52.0~codemirror.min.css',
                'codemirror#5.52.0~theme/blackboard.min.css',
                ...(withInstall?.css || []),
            ],
        }),
    )
}
