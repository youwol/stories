// eslint-disable-next-line eslint-comments/disable-enable-pair -- to not have problem
/* eslint-disable jest/no-done-callback -- eslint-comment It is required because */

import { installMockPackages } from './mock-packages'
import { AppState, load$ } from '../app/main-app/app-state'
import { EditorView } from '../app/main-panels/document-editor/editor/editor.view'
import { setupMockService } from '../app/utils/mock-service'
import { storiesUnitTests } from './mock-data/database'
import { mergeMap, tap } from 'rxjs/operators'

installMockPackages()

setupMockService(storiesUnitTests)

const storyId = 'test-story'
AppState.debounceTimeSave = 1

test('load story, add emoji', (done) => {
    load$(storyId, document.body).subscribe(() => {
        // WHEN application is loaded ...
        // EXPECT - 1 : tree-view with node 'test-story' is displayed
        const storyView = document.getElementById('test-story')
        expect(storyView).toBeTruthy()

        // EXPECT - 2 : editor view is displayed
        const editorView = document.getElementById(
            'editor-view',
        ) as any as EditorView
        expect(editorView).toBeTruthy()

        editorView.codeMirrorEditor$.subscribe(() => {
            const codeMirrorView = document.getElementById('CodeMirror')
            expect(codeMirrorView).toBeTruthy()
            const emojiPopupView = document.querySelector(
                '.editor-view-header-emoji',
            )
            expect(emojiPopupView).toBeTruthy()
            emojiPopupView.dispatchEvent(new Event('click', { bubbles: true }))

            const emojiView = document.querySelector('.emojis-modal-view-item')
            expect(emojiView).toBeTruthy()
            emojiView.dispatchEvent(new Event('click', { bubbles: true }))
        })
        editorView.emojis$
            .pipe(
                tap((emoji) => expect(emoji).toBe('😀')),
                mergeMap(() => editorView.codeMirrorEditor$),
            )
            .subscribe((cm) => {
                setTimeout(() => {
                    expect(cm.replacedRanges).toHaveLength(1)
                    done()
                }, 0)
            })
    })
})
