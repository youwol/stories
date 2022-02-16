// eslint-disable-next-line eslint-comments/disable-enable-pair -- to not have problem
/* eslint-disable jest/no-done-callback -- eslint-comment It is required because */

import { CodeMirror, installMockPackages } from './mock-packages'
import { filter, mergeMap, tap } from 'rxjs/operators'
import { AppState, load$, SavingStatus } from '../app/main-app/app-state'
import { Client } from '../app/client/client'
import { EditorView } from '../app/main-panels/document-editor/editor/editor.view'
import { RenderView } from '../app/main-panels/document-editor/render/render.view'
import { setupMockService } from '../app/utils/mock-service'
import { contentRoot } from './mock-data/test-story-root'
import { contentYouwolView } from './mock-data/test-story-youwol-view'
import { sanitizeCodeScript } from '../app/main-panels/document-editor/render/renderers'
import { storiesUnitTests } from './mock-data/database'
import { contentMarkdown } from './mock-data/test-story-markdown'
import { combineLatest } from 'rxjs'

installMockPackages()

setupMockService(storiesUnitTests)

const storyId = 'test-story'
AppState.debounceTimeSave = 1

test('load story, make sure everything is displayed', (done) => {
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
            // AND :it displays 'contentRoot' text
            const innerTextCodeMirror = codeMirrorView.innerHTML
            expect(innerTextCodeMirror.trim()).toEqual(contentRoot.trim())
        })

        // EXPECT - 3 : render view is displayed
        const renderView = document.getElementById(
            'render-view',
        ) as any as RenderView
        expect(renderView).toBeTruthy()

        // AND : its content has been processed by 'marked' & 'mathjax'
        renderView.renderedElement$.subscribe(({ htmlElement }) => {
            // MathJax mock include 'mathjax' in class list
            expect(htmlElement.classList.contains('mathjax')).toBeTruthy()
            const heading1 = htmlElement.querySelector('h1')
            // Marked is not mocked,
            expect(heading1).toBeTruthy()
            expect(heading1.innerHTML.trim()).toEqual(
                contentRoot.replace('#', '').trim(),
            )
            done()
        })
    })
})

test('load story, expand root  node, select markdown document', (done) => {
    load$(storyId, document.body).subscribe(({ appState }) => {
        // EXPECT nothing to be saved within this test
        appState.save$.subscribe((d) => {
            expect(true).toBeFalsy()
        })

        // WHEN application is loaded ...
        // EXPECT tree-view with node 'test-story' is displayed
        const storyView = document.getElementById('test-story')
        expect(storyView).toBeTruthy()

        // WHEN the test-story node is expanded
        storyView.dispatchEvent(new Event('click', { bubbles: true }))

        // EXPECT its children are displayed
        const docViews = Array.from(document.querySelectorAll('.document'))
        expect(docViews).toHaveLength(3)

        // WHEN a child is expanded (contentMarkdown)
        docViews[0].dispatchEvent(new Event('click', { bubbles: true }))

        // EXPECT - 1: the content of the code mirror editor displayed 'contentMarkdown'
        const editorView = document.getElementById(
            'editor-view',
        ) as any as EditorView
        expect(editorView).toBeTruthy()

        editorView.codeMirrorEditor$.subscribe(() => {
            const innerTextCodeMirror =
                document.getElementById('CodeMirror').innerHTML
            expect(sanitizeCodeScript(innerTextCodeMirror).trim()).toEqual(
                contentMarkdown.trim(),
            )
        })

        // EXPECT - 2 the content of the renderer view display the virtual DOM loaded from 'contentMarkdown'
        const renderView = document.getElementById(
            'render-view',
        ) as any as RenderView
        renderView.renderedElement$
            .pipe(
                filter(
                    ({ document }) =>
                        document.documentId == 'test-story-markdown',
                ),
            )
            .subscribe(({ htmlElement }: { htmlElement: HTMLDivElement }) => {
                // The code snippet is included with syntax EditorState
                const codeSnippet = htmlElement.querySelector('code.hljs')
                expect(codeSnippet).toBeTruthy()

                done()
            })
    })
})

test('load story, change editor content and check savings', (done) => {
    const newContent = 'New content :)'

    load$(storyId, document.body).subscribe(({ appState }) => {
        const editorView = document.getElementById(
            'editor-view',
        ) as any as EditorView

        const modified$ = appState.save$.pipe(
            filter((save) => {
                return save.status == SavingStatus.modified
            }),
        )
        modified$.subscribe((save) => {
            const saveView = document.querySelector('.explorer-save-item')
            expect(saveView).toBeTruthy()
            saveView.dispatchEvent(new MouseEvent('click', { bubbles: true }))
            //appState.save(save.document, save.content)
        })
        const start$ = appState.save$.pipe(
            filter((save) => {
                return save.status == SavingStatus.started
            }),
        )
        const saved$ = appState.save$.pipe(
            filter((save) => {
                return save.status == SavingStatus.saved
            }),
        )
        combineLatest([modified$, start$, saved$])
            .pipe(
                mergeMap(() => {
                    // WHEN the content is retrieved from the database
                    return Client.getContent$(storyId, 'root-test-story')
                }),
            )
            .subscribe((content: string) => {
                // EXPECT the content is what expected
                expect(content).toEqual(newContent)
                done()
            })

        //let editorState = editorView.editorState
        // WHEN the code mirror editor is ready
        editorView.codeMirrorEditor$
            .pipe(
                tap((cmEditor: CodeMirror) => {
                    // EXPECT the code mirror editor is available
                    expect(cmEditor).toBeTruthy()
                    // WHEN its content is changed; this method is only available in the mock
                    cmEditor.changeValue(newContent)
                }),
            )
            .subscribe(() => {})
    })
})

test('load story, expand root  node, select a document with flux-views', (done) => {
    RenderView.debounceTime = 0
    load$(storyId, document.body).subscribe(() => {
        // WHEN application is loaded ...
        // EXPECT tree-view with node 'test-story' is displayed
        const storyView = document.getElementById('test-story')
        expect(storyView).toBeTruthy()

        // WHEN the test-story node is expanded
        storyView.dispatchEvent(new Event('click', { bubbles: true }))

        // EXPECT its children are displayed
        const docViews = Array.from(document.querySelectorAll('.document'))
        expect(docViews).toHaveLength(3)

        // WHEN a child is expanded (contentYouWol)
        docViews[2].dispatchEvent(new Event('click', { bubbles: true }))

        // EXPECT - 1: the content of the code mirror editor displayed 'contentYouwolView'
        const editorView = document.getElementById(
            'editor-view',
        ) as any as EditorView
        expect(editorView).toBeTruthy()

        editorView.codeMirrorEditor$.subscribe(() => {
            const innerTextCodeMirror =
                document.getElementById('CodeMirror').innerHTML
            expect(sanitizeCodeScript(innerTextCodeMirror).trim()).toEqual(
                contentYouwolView.trim(),
            )
        })

        // EXPECT - 2 the content of the renderer view display the virtual DOM loaded from 'contentYouwolView'
        const renderView = document.getElementById(
            'render-view',
        ) as any as RenderView
        renderView.renderedElement$.subscribe(({ document, htmlElement }) => {
            expect(document.documentId).toBe('test-story-youwol-view')
            // There is one correctly formatted code
            const storyView = htmlElement.querySelector('.story-view')
            expect(storyView).toBeTruthy()
            // The 'load' callback of HTMLScriptElement is not triggered => can not test the 2 following lines
            //expect(youwolView).toBeTruthy()
            //expect(youwolView.innerHTML).toEqual("Test YouWol View")
            // let errorView = htmlElement.querySelector(".youwol-view-error .message")
            // expect(errorView).toBeTruthy()

            done()
        })
    })
})
