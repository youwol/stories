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
            scripts: [
                ...(withInstall?.scripts || []),
                /*'codemirror#5.52.0~mode/javascript.min.js',
                'codemirror#5.52.0~mode/markdown.min.js',
                'codemirror#5.52.0~mode/css.min.js',
                'codemirror#5.52.0~mode/xml.min.js',
                'codemirror#5.52.0~mode/htmlmixed.min.js',
                'codemirror#5.52.0~mode/gfm.min.js',
                */
            ],
            css: [
                'codemirror#5.52.0~codemirror.min.css',
                'codemirror#5.52.0~theme/blackboard.min.css',
                ...(withInstall?.css || []),
            ],
        }),
    )
}
