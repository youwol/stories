import { installMockPackages } from './mock-packages'
import { load$ } from '../app/main-app/app-state'
import { Client } from '../app/client/client'
import { setupMockService } from '../app/utils/mock-service'
import { storiesUnitTests } from './mock-data/database'
import { TextInput } from '@youwol/fv-input'

installMockPackages()

setupMockService(storiesUnitTests)

const storyId = 'test-story'

test('load story, display context menu', (done) => {
    load$(storyId, document.body).subscribe(() => {
        // WHEN application is loaded ...
        const storyView = document.getElementById('test-story')

        // EXPECT story node is displayed
        expect(storyView).toBeTruthy()
        const storyNodeView = document.querySelector('#test-story span')
        expect(storyNodeView.innerText).toBe('Test story')

        // WHEN context menu triggered ...
        const event = document.createEvent('HTMLEvents')
        event.initEvent('contextmenu', true, false)
        storyView.dispatchEvent(event)

        // EXPECT it appears
        const contextMenuView = document.getElementById('context-menu-view')
        expect(contextMenuView).toBeTruthy()
        done()
    })
})

test('load story, select story, display context menu, rename story', (done) => {
    load$(storyId, document.body).subscribe(() => {
        let storyView = document.getElementById('test-story')

        // WHEN context menu triggered on story ...
        const event = document.createEvent('HTMLEvents')
        event.initEvent('contextmenu', true, false)
        storyView.dispatchEvent(event)

        // EXPECT - 1 : it appears
        const contextMenuView = document.getElementById('context-menu-view')
        expect(contextMenuView).toBeTruthy()

        // EXPECT - 2 : rename story action is available
        const renameView = document.querySelector('#node-rename-story span')
        expect(renameView).toBeTruthy()
        expect(renameView.innerText).toBe('rename story')

        // WHEN rename story triggered ...
        renameView.dispatchEvent(new Event('click', { bubbles: true }))

        // EXPECT text input is displayed in selected node
        const textInputView = document.querySelector(
            '#node-root-test-story input',
        )
        expect(textInputView).toBeTruthy()

        // WHEN new name is provided ...
        textInputView.dispatchEvent(new Event('click', { bubbles: true }))
        textInputView.dispatchEvent(new KeyboardEvent('keydown', { key: 'R' }))
        textInputView.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }))
        textInputView.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }))
        textInputView.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
        textInputView.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }))
        textInputView.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }))
        textInputView.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }))
        textInputView.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Enter' }),
        )

        // EXPECT - 1 : node name is updated (somehow the consecutive keypresses do not store 'renamed')
        storyView = document.querySelector('#test-story span')
        expect(storyView.innerText).toBe('')

        // EXPECT - 2 : new name is saved in the database
        Client.getStory$(storyId).subscribe(({ story }) => {
            expect(story.title).toBe('')
            done()
        })
    })
})

test('load story, select document, display context menu, rename document', (done) => {
    load$(storyId, document.body).subscribe(() => {
        // WHEN story node is expanded ...
        const storyView = document.getElementById('test-story')
        storyView.dispatchEvent(new Event('click', { bubbles: true }))

        // EXPECT markdown node is displayed in the tree view
        let markdownView = document.getElementById('test-story-markdown')
        expect(markdownView).toBeTruthy()

        // WHEN context menu triggered on document ...
        const event = document.createEvent('HTMLEvents')
        event.initEvent('contextmenu', true, false)
        markdownView.dispatchEvent(event)

        // EXPECT - 1 : it appears
        const contextMenuView = document.getElementById('context-menu-view')
        expect(contextMenuView).toBeTruthy()

        // EXPECT - 2 : rename document action is available
        const renameView = document.querySelector('#node-rename-document span')
        expect(renameView).toBeTruthy()
        expect(renameView.innerText).toBe('rename document')

        // WHEN rename document triggered ...
        renameView.dispatchEvent(new Event('click', { bubbles: true }))

        // EXPECT text input is displayed in selected node
        const textInputView = document.querySelector(
            '#node-test-story-markdown input',
        )
        expect(textInputView).toBeTruthy()

        // WHEN new name is provided ...
        textInputView.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Enter' }),
        )

        // EXPECT - 1 : node name is updated
        markdownView = document.querySelector('#test-story-markdown span')
        expect(markdownView.innerText).toBe('')

        // EXPECT - 2 : new name is saved in the database
        Client.getDocument$(storyId, 'test-story-markdown').subscribe(
            (document) => {
                expect(document.title).toBe('')
                done()
            },
        )
    })
})

test('load story, select document, display context menu, delete document', (done) => {
    load$(storyId, document.body).subscribe(() => {
        // WHEN story node is expanded ...
        const storyView = document.getElementById('test-story')
        storyView.dispatchEvent(new Event('click', { bubbles: true }))

        // EXPECT markdown document appears
        let markdownView = document.getElementById('test-story-markdown')
        expect(markdownView).toBeTruthy()

        // WHEN context menu triggered on document ...
        const event = document.createEvent('HTMLEvents')
        event.initEvent('contextmenu', true, false)
        markdownView.dispatchEvent(event)

        // EXPECT - 1 : it appears
        const contextMenuView = document.getElementById('context-menu-view')
        expect(contextMenuView).toBeTruthy()

        // EXPECT - 2 : delete document action is available
        const deleteView = document.querySelector('#node-delete-document span')
        expect(deleteView).toBeTruthy()
        expect(deleteView.innerText).toBe('delete document')

        // WHEN delete triggered ...
        deleteView.dispatchEvent(new Event('click', { bubbles: true }))

        // EXPECT - 1 : node is deleted in the tree view
        markdownView = document.getElementById('test-story-markdown')
        expect(markdownView).toBeFalsy()

        // EXPECT - 2 : database is updated
        Client.getChildren$(storyId, {
            parentDocumentId: 'root-test-story',
        }).subscribe((documents) => {
            expect(documents).toHaveLength(2)
            expect(documents[0].title).toBe('Latex')
            done()
        })
    })
})

test('load story, select story, display context menu, add child', (done) => {
    load$(storyId, document.body).subscribe(() => {
        // WHEN context menu triggered on story node ...
        const storyView = document.getElementById('test-story')
        storyView.dispatchEvent(new Event('click', { bubbles: true }))
        const event = document.createEvent('HTMLEvents')
        event.initEvent('contextmenu', true, false)
        storyView.dispatchEvent(event)

        // EXPECT - 1 : it appears
        const contextMenuView = document.getElementById('context-menu-view')
        expect(contextMenuView).toBeTruthy()

        // EXPECT - 2 : add document action is available
        const addDoc = document.querySelector('#node-add-document span')
        expect(addDoc).toBeTruthy()
        expect(addDoc.innerText).toBe('new document')

        // WHEN add document is selected
        addDoc.dispatchEvent(new Event('click', { bubbles: true }))

        // THEN WHEN create empty document is selected
        const newEmpty = document.querySelector('#node-add-document-empty span')
        expect(newEmpty).toBeTruthy()
        expect(newEmpty.innerText).toBe('empty document')

        newEmpty.dispatchEvent(new Event('click', { bubbles: true }))

        // EXPECT database is updated
        Client.getChildren$(storyId, {
            parentDocumentId: 'root-test-story',
        }).subscribe((documents) => {
            expect(documents).toHaveLength(3)
            expect(documents[2].title).toBe('New document')
            done()
        })
    })
})

test('load story, select document, display context menu, add child', (done) => {
    load$(storyId, document.body).subscribe(() => {
        // WHEN story node is expanded ...
        const storyView = document.getElementById('test-story')
        storyView.dispatchEvent(new Event('click', { bubbles: true }))

        // EXPECT latex document appears
        const latexView = document.getElementById('test-story-latex')
        expect(latexView).toBeTruthy()
        latexView.dispatchEvent(new Event('click', { bubbles: true }))

        // WHEN context menu triggered on latex node ...
        const event = document.createEvent('HTMLEvents')
        event.initEvent('contextmenu', true, false)
        latexView.dispatchEvent(event)

        // EXPECT - 1 : it appears
        const contextMenuView = document.getElementById('context-menu-view')
        expect(contextMenuView).toBeTruthy()

        // EXPECT - 2 : add document action is available
        const newDoc = document.querySelector('#node-add-document span')
        expect(newDoc).toBeTruthy()
        expect(newDoc.innerText).toBe('new document')

        // WHEN add document is selected
        newDoc.dispatchEvent(new Event('click', { bubbles: true }))

        // THEN WHEN create empty document is selected
        const newEmpty = document.querySelector('#node-add-document-empty span')
        expect(newEmpty).toBeTruthy()
        expect(newEmpty.innerText).toBe('empty document')

        newEmpty.dispatchEvent(new Event('click', { bubbles: true }))

        // EXPECT database is updated
        Client.getChildren$(storyId, {
            parentDocumentId: 'test-story-latex',
        }).subscribe((documents) => {
            expect(documents).toHaveLength(1)
            expect(documents[0].title).toBe('New document')
            done()
        })
    })
})

test('load story, select document, display context menu, add flux-module child', (done) => {
    window['TestToolbox'] = {
        TestModule: {
            displayName: 'test module',
            packId: 'TestToolBox',
            id: 'TestModule',
            resources: {
                youwol: 'youwol.platform.com',
            },
        },
    }

    load$(storyId, document.body).subscribe(() => {
        // WHEN story node is expanded ...
        const storyView = document.getElementById('test-story')
        storyView.dispatchEvent(new Event('click', { bubbles: true }))

        // EXPECT latex document appears
        const latexView = document.getElementById('test-story-latex')
        expect(latexView).toBeTruthy()
        latexView.dispatchEvent(new Event('click', { bubbles: true }))
        // WHEN context menu triggered on latex node ...
        const event = document.createEvent('HTMLEvents')
        event.initEvent('contextmenu', true, false)
        latexView.dispatchEvent(event)

        // EXPECT - 1 : it appears
        const contextMenuView = document.getElementById('context-menu-view')
        expect(contextMenuView).toBeTruthy()

        // EXPECT - 2 : add document action is available
        const newDoc = document.querySelector('#node-add-document span')
        expect(newDoc).toBeTruthy()
        expect(newDoc.innerText).toBe('new document')

        // WHEN add document is selected
        newDoc.dispatchEvent(new Event('click', { bubbles: true }))

        // THEN WHEN create brick template document is selected
        const newTemplateMdleFlux = document.querySelector(
            '#node-add-document-template-brick span',
        )
        expect(newTemplateMdleFlux).toBeTruthy()
        expect(newTemplateMdleFlux.innerText).toBe('brick template')

        newTemplateMdleFlux.dispatchEvent(new Event('click', { bubbles: true }))

        // EXPECT modal to pick module is selected
        const modalView = document.querySelector('#modal-select-module')
        expect(modalView).toBeTruthy()

        const inputToolboxIdView = document.querySelector(
            '#toolbox-id input',
        ) as TextInput.View
        expect(inputToolboxIdView).toBeTruthy()
        inputToolboxIdView.state.value$.next('TestToolbox')
        const inputBrickIdView = document.querySelector(
            '#brick-id input',
        ) as TextInput.View
        expect(inputBrickIdView).toBeTruthy()
        inputBrickIdView.state.value$.next('TestModule')

        const okBtn = document.querySelector('#modal-select-module button')
        expect(okBtn).toBeTruthy()

        okBtn.dispatchEvent(new Event('click', { bubbles: true }))

        // EXPECT new child added for 'test module'
        // setTimeout to put the check at the very end of the remaining coroutines list
        setTimeout(
            () =>
                Client.getChildren$(storyId, {
                    parentDocumentId: 'test-story-latex',
                }).subscribe((documents) => {
                    expect(documents).toHaveLength(2)
                    expect(documents[1].title).toBe('test module')
                    done()
                }),
            0,
        )
    })
})

test('load story, select document, display context menu, set flux-pack template', (done) => {
    window['TestToolbox'] = {
        pack: {
            modules: {
                TestModule0: {
                    displayName: 'test module 0',
                    packId: 'TestToolBox0',
                    id: 'TestModule',
                    resources: {
                        youwol: 'youwol.platform.com',
                    },
                },
                TestModule1: {
                    displayName: 'test module 1',
                    packId: 'TestToolBox1',
                    id: 'TestModule',
                    resources: {
                        youwol: 'youwol.platform.com',
                    },
                },
            },
        },
    }

    load$(storyId, document.body).subscribe(() => {
        // WHEN story node is expanded ...
        const storyView = document.getElementById('test-story')
        storyView.dispatchEvent(new Event('click', { bubbles: true }))

        // WHEN context menu triggered on latex node ...
        const event = document.createEvent('HTMLEvents')
        event.initEvent('contextmenu', true, false)
        storyView.dispatchEvent(event)

        // EXPECT - 1 : it appears
        const contextMenuView = document.getElementById('context-menu-view')
        expect(contextMenuView).toBeTruthy()

        // EXPECT - 2 : set from template action is available
        const newDoc = document.querySelector('#node-set-from-template span')
        expect(newDoc).toBeTruthy()
        expect(newDoc.innerText).toBe('Set from template')

        // WHEN add document is selected
        newDoc.dispatchEvent(new Event('click', { bubbles: true }))

        // THEN WHEN create brick template document is selected
        const newTemplateToolbox = document.querySelector(
            '#node-set-from-template-toolbox span',
        )
        expect(newTemplateToolbox).toBeTruthy()
        expect(newTemplateToolbox.innerText).toBe('Toolbox')

        newTemplateToolbox.dispatchEvent(new Event('click', { bubbles: true }))

        // EXPECT modal to pick module is selected
        const modalView = document.querySelector('#modal-select-module')
        expect(modalView).toBeTruthy()

        const inputToolboxIdView = document.querySelector(
            '#toolbox-id input',
        ) as TextInput.View
        expect(inputToolboxIdView).toBeTruthy()
        inputToolboxIdView.state.value$.next('TestToolbox')

        const okBtn = document.querySelector('#modal-select-module button')
        expect(okBtn).toBeTruthy()
        okBtn.dispatchEvent(new Event('click', { bubbles: true }))

        // EXPECT new children added for 'test module 0' & 'test module 1'
        // setTimeout to put the check at the very end of the remaining coroutines list
        setTimeout(() => {
            const spans = Array.from(document.querySelectorAll('span'))
                .map((s) => s.innerText)
                .filter((text) => text.includes('test module'))

            expect(spans).toEqual(['test module 0', 'test module 1'])

            Client.getChildren$(storyId, {
                parentDocumentId: 'root-test-story',
            }).subscribe((documents) => {
                expect(documents).toHaveLength(5)
                expect(documents[3].title).toBe('test module 0')
                expect(documents[4].title).toBe('test module 1')
                done()
            }),
                0
        })
    })
})
