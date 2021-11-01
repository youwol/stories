
import { installMockPackages } from './mock-packages'
installMockPackages()

import { AppState, load$ } from "../app/main-app/app-state"
import { EditorView } from "../app/main-panels/document-editor/editor/editor.view"
import { RenderView } from "../app/main-panels/document-editor/render/render.view"
import { setupMockService } from "../app/utils/mock-service"
import { contentRoot } from "./mock-data/test-story-root"
import { storiesUnitTests } from './mock-data/database'
import { mergeMap, tap } from 'rxjs/operators'


setupMockService(storiesUnitTests)

let storyId = 'test-story'
AppState.debounceTimeSave = 1

test('load story, add emoji', (done) => {

    load$(storyId, document.body)
        .subscribe(() => {

            // WHEN application is loaded ...
            // EXPECT - 1 : tree-view with node 'test-story' is displayed
            let storyView = document.getElementById("test-story")
            expect(storyView).toBeTruthy()

            // EXPECT - 2 : editor view is displayed
            let editorView = document.getElementById("editor-view") as any as EditorView
            expect(editorView).toBeTruthy()

            editorView.codeMirrorEditor$.subscribe(() => {
                let codeMirrorView = document.getElementById("CodeMirror")
                expect(codeMirrorView).toBeTruthy()
                let emojiPopupView = document.querySelector('.editor-view-header-emoji')
                expect(emojiPopupView).toBeTruthy()
                emojiPopupView.dispatchEvent(new Event('click', { bubbles: true }))

                let emojiView = document.querySelector('.emojis-modal-view-item')
                expect(emojiView).toBeTruthy()
                emojiView.dispatchEvent(new Event('click', { bubbles: true }))
            })
            editorView.emojis$.pipe(
                tap(emoji =>
                    expect(emoji).toEqual("😀")
                ),
                mergeMap(() => editorView.codeMirrorEditor$)
            ).subscribe(cm => {
                setTimeout(() => {
                    expect(cm.replacedRanges.length).toEqual(1)
                    done()
                }, 0)
            })
        })
})

