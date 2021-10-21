import { installMockPackages } from './mock-packages'
installMockPackages()

import { load$ } from "../app/main-app/app-state"
import { Client } from "../app/client/client"
import { setupMockService } from "../app/utils/mock-service"
import { storiesUnitTests } from './mock-data/database'
import { TextInput } from '@youwol/fv-input'


setupMockService(storiesUnitTests)

let storyId = 'test-story'

test('load story, display context menu', (done) => {

    load$(storyId, document.body)
        .subscribe(() => {

            // WHEN application is loaded ...
            let storyView = document.getElementById("test-story")

            // EXPECT story node is displayed
            expect(storyView).toBeTruthy()
            let storyNodeView = document.querySelector("#test-story span") as HTMLSpanElement
            expect(storyNodeView.innerText).toEqual("Test story")

            // WHEN context menu triggered ...
            let event = document.createEvent('HTMLEvents');
            event.initEvent('contextmenu', true, false);
            storyView.dispatchEvent(event)

            // EXPECT it appears
            let contextMenuView = document.getElementById("context-menu-view")
            expect(contextMenuView).toBeTruthy()
            done()
        })
})

test('load story, select story, display context menu, rename story', (done) => {

    load$(storyId, document.body)
        .subscribe(() => {

            let storyView = document.getElementById("test-story")

            // WHEN context menu triggered on story ...
            let event = document.createEvent('HTMLEvents');
            event.initEvent('contextmenu', true, false);
            storyView.dispatchEvent(event)

            // EXPECT - 1 : it appears
            let contextMenuView = document.getElementById("context-menu-view")
            expect(contextMenuView).toBeTruthy()

            // EXPECT - 2 : rename story action is available
            let renameView = document.querySelector("#node-rename-story span") as HTMLSpanElement
            expect(renameView).toBeTruthy()
            expect(renameView.innerText).toEqual("rename story")

            // WHEN rename story triggered ...
            renameView.dispatchEvent(new Event('click', { bubbles: true }))

            // EXPECT text input is displayed in selected node
            let textInputView = document.querySelector("#node-root-test-story input") as HTMLInputElement
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
            textInputView.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', }))

            // EXPECT - 1 : node name is updated (somehow the consecutive keypresses do not store 'renamed')
            storyView = document.querySelector("#test-story span") as HTMLSpanElement
            expect(storyView.innerText).toEqual("")

            // EXPECT - 2 : new name is saved in the database
            Client.getStory$(storyId).subscribe((story) => {
                expect(story.title).toEqual("")
                done()
            })
        })
})

test('load story, select document, display context menu, rename document', (done) => {

    load$(storyId, document.body)
        .subscribe(() => {

            // WHEN story node is expanded ...
            let storyView = document.getElementById("test-story")
            storyView.dispatchEvent(new Event('click', { bubbles: true }))

            // EXPECT markdown node is displayed in the tree view
            let markdownView = document.getElementById("test-story-markdown")
            expect(markdownView).toBeTruthy()

            // WHEN context menu triggered on document ...
            let event = document.createEvent('HTMLEvents');
            event.initEvent('contextmenu', true, false);
            markdownView.dispatchEvent(event)

            // EXPECT - 1 : it appears
            let contextMenuView = document.getElementById("context-menu-view")
            expect(contextMenuView).toBeTruthy()

            // EXPECT - 2 : rename document action is available
            let renameView = document.querySelector("#node-rename-document span") as HTMLSpanElement
            expect(renameView).toBeTruthy()
            expect(renameView.innerText).toEqual("rename document")

            // WHEN rename document triggered ...
            renameView.dispatchEvent(new Event('click', { bubbles: true }))

            // EXPECT text input is displayed in selected node
            let textInputView = document.querySelector("#node-test-story-markdown input") as HTMLInputElement
            expect(textInputView).toBeTruthy()

            // WHEN new name is provided ...
            textInputView.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', }))

            // EXPECT - 1 : node name is updated
            markdownView = document.querySelector("#test-story-markdown span") as HTMLSpanElement
            expect(markdownView.innerText).toEqual("")

            // EXPECT - 2 : new name is saved in the database
            Client.getDocument$(storyId, "test-story-markdown")
                .subscribe((document) => {
                    expect(document.title).toEqual("")
                    done()
                })
        })
})

test('load story, select document, display context menu, delete document', (done) => {

    load$(storyId, document.body)
        .subscribe(() => {

            // WHEN story node is expanded ...
            let storyView = document.getElementById("test-story")
            storyView.dispatchEvent(new Event('click', { bubbles: true }))

            // EXPECT markdown document appears
            let markdownView = document.getElementById("test-story-markdown")
            expect(markdownView).toBeTruthy()

            // WHEN context menu triggered on document ...
            let event = document.createEvent('HTMLEvents');
            event.initEvent('contextmenu', true, false);
            markdownView.dispatchEvent(event)

            // EXPECT - 1 : it appears
            let contextMenuView = document.getElementById("context-menu-view")
            expect(contextMenuView).toBeTruthy()

            // EXPECT - 2 : delete document action is available
            let deleteView = document.querySelector("#node-delete-document span") as HTMLSpanElement
            expect(deleteView).toBeTruthy()
            expect(deleteView.innerText).toEqual("delete document")

            // WHEN delete triggered ...
            deleteView.dispatchEvent(new Event('click', { bubbles: true }))

            // EXPECT - 1 : node is deleted in the tree view
            markdownView = document.getElementById("test-story-markdown")
            expect(markdownView).toBeFalsy()

            // EXPECT - 2 : database is updated
            Client.getChildren$(
                storyId, { parentDocumentId: "root-test-story" })
                .subscribe((documents) => {
                    expect(documents.length).toEqual(2)
                    expect(documents[0].title).toEqual("Latex")
                    done()
                })
        })
})

test('load story, select story, display context menu, add child', (done) => {

    load$(storyId, document.body)
        .subscribe(() => {

            // WHEN context menu triggered on story node ...
            let storyView = document.getElementById("test-story")
            storyView.dispatchEvent(new Event("click", { bubbles: true }))
            let event = document.createEvent('HTMLEvents');
            event.initEvent('contextmenu', true, false);
            storyView.dispatchEvent(event)

            // EXPECT - 1 : it appears
            let contextMenuView = document.getElementById("context-menu-view")
            expect(contextMenuView).toBeTruthy()

            // EXPECT - 2 : add document action is available
            let addDoc = document.querySelector("#node-add-document span") as HTMLSpanElement
            expect(addDoc).toBeTruthy()
            expect(addDoc.innerText).toEqual("new document")

            // WHEN add document is selected
            addDoc.dispatchEvent(new Event('click', { bubbles: true }))

            // THEN WHEN create empty document is selected
            let newEmpty = document.querySelector("#node-add-document-empty span") as HTMLSpanElement
            expect(newEmpty).toBeTruthy()
            expect(newEmpty.innerText).toEqual("empty document")

            newEmpty.dispatchEvent(new Event('click', { bubbles: true }))

            // EXPECT database is updated
            Client.getChildren$(
                storyId, { parentDocumentId: "root-test-story" })
                .subscribe((documents) => {
                    expect(documents.length).toEqual(3)
                    expect(documents[2].title).toEqual("New document")
                    done()
                })
        })
})


test('load story, select document, display context menu, add child', (done) => {

    load$(storyId, document.body)
        .subscribe(() => {

            // WHEN story node is expanded ...
            let storyView = document.getElementById("test-story")
            storyView.dispatchEvent(new Event('click', { bubbles: true }))

            // EXPECT latex document appears
            let latexView = document.getElementById("test-story-latex")
            expect(latexView).toBeTruthy()
            latexView.dispatchEvent(new Event("click", { bubbles: true }))

            // WHEN context menu triggered on latex node ...
            let event = document.createEvent('HTMLEvents');
            event.initEvent('contextmenu', true, false);
            latexView.dispatchEvent(event)

            // EXPECT - 1 : it appears
            let contextMenuView = document.getElementById("context-menu-view")
            expect(contextMenuView).toBeTruthy()

            // EXPECT - 2 : add document action is available
            let newDoc = document.querySelector("#node-add-document span") as HTMLSpanElement
            expect(newDoc).toBeTruthy()
            expect(newDoc.innerText).toEqual("new document")

            // WHEN add document is selected
            newDoc.dispatchEvent(new Event('click', { bubbles: true }))

            // THEN WHEN create empty document is selected
            let newEmpty = document.querySelector("#node-add-document-empty span") as HTMLSpanElement
            expect(newEmpty).toBeTruthy()
            expect(newEmpty.innerText).toEqual("empty document")

            newEmpty.dispatchEvent(new Event('click', { bubbles: true }))

            // EXPECT database is updated
            Client.getChildren$(
                storyId, { parentDocumentId: "test-story-latex" })
                .subscribe((documents) => {
                    expect(documents.length).toEqual(1)
                    expect(documents[0].title).toEqual("New document")
                    done()
                })
        })
})


test('load story, select document, display context menu, add flux-module child', (done) => {

    window["TestToolbox"] = {
        TestModule: {
            displayName: 'test module',
            packId: 'TestToolBox',
            id: 'TestModule',
            resources: {
                youwol: "youwol.platform.com"
            }
        }
    }

    load$(storyId, document.body)
        .subscribe(() => {

            // WHEN story node is expanded ...
            let storyView = document.getElementById("test-story")
            storyView.dispatchEvent(new Event('click', { bubbles: true }))

            // EXPECT latex document appears
            let latexView = document.getElementById("test-story-latex")
            expect(latexView).toBeTruthy()
            latexView.dispatchEvent(new Event("click", { bubbles: true }))
            // WHEN context menu triggered on latex node ...
            let event = document.createEvent('HTMLEvents');
            event.initEvent('contextmenu', true, false);
            latexView.dispatchEvent(event)

            // EXPECT - 1 : it appears
            let contextMenuView = document.getElementById("context-menu-view")
            expect(contextMenuView).toBeTruthy()

            // EXPECT - 2 : add document action is available
            let newDoc = document.querySelector("#node-add-document span") as HTMLSpanElement
            expect(newDoc).toBeTruthy()
            expect(newDoc.innerText).toEqual("new document")

            // WHEN add document is selected
            newDoc.dispatchEvent(new Event('click', { bubbles: true }))

            // THEN WHEN create brick template document is selected
            let newTemplateMdleFlux = document.querySelector("#node-add-document-template-brick span") as HTMLSpanElement
            expect(newTemplateMdleFlux).toBeTruthy()
            expect(newTemplateMdleFlux.innerText).toEqual("brick template")

            newTemplateMdleFlux.dispatchEvent(new Event('click', { bubbles: true }))

            // EXPECT modal to pick module is selected
            let modalView = document.querySelector("#modal-select-module")
            expect(modalView).toBeTruthy()

            let inputToolboxIdView = document.querySelector("#toolbox-id input") as any as TextInput.View
            expect(inputToolboxIdView).toBeTruthy()
            inputToolboxIdView.state.value$.next("TestToolbox")
            let inputBrickIdView = document.querySelector("#brick-id input") as any as TextInput.View
            expect(inputBrickIdView).toBeTruthy()
            inputBrickIdView.state.value$.next("TestModule")

            let okBtn = document.querySelector("#modal-select-module button")
            expect(okBtn).toBeTruthy()

            okBtn.dispatchEvent(new Event('click', { bubbles: true }))

            // EXPECT new child added for 'test module'
            // setTimeout to put the check at the very end of the remaining coroutines list
            setTimeout(
                () => Client.getChildren$(
                    storyId,
                    { parentDocumentId: "test-story-latex" })
                    .subscribe((documents) => {
                        expect(documents.length).toEqual(2)
                        expect(documents[1].title).toEqual("test module")
                        done()
                    }), 0)
        })
})

test('load story, select document, display context menu, set flux-pack template', (done) => {
    window["TestToolbox"] = {
        pack: {
            modules: {
                TestModule0: {
                    displayName: 'test module 0',
                    packId: 'TestToolBox0',
                    id: 'TestModule',
                    resources: {
                        youwol: "youwol.platform.com"
                    }
                },
                TestModule1: {
                    displayName: 'test module 1',
                    packId: 'TestToolBox1',
                    id: 'TestModule',
                    resources: {
                        youwol: "youwol.platform.com"
                    }
                }
            }
        }
    }

    load$(storyId, document.body)
        .subscribe(() => {

            // WHEN story node is expanded ...
            let storyView = document.getElementById("test-story")
            storyView.dispatchEvent(new Event('click', { bubbles: true }))

            // WHEN context menu triggered on latex node ...
            let event = document.createEvent('HTMLEvents');
            event.initEvent('contextmenu', true, false);
            storyView.dispatchEvent(event)

            // EXPECT - 1 : it appears
            let contextMenuView = document.getElementById("context-menu-view")
            expect(contextMenuView).toBeTruthy()

            // EXPECT - 2 : set from template action is available
            let newDoc = document.querySelector("#node-set-from-template span") as HTMLSpanElement
            expect(newDoc).toBeTruthy()
            expect(newDoc.innerText).toEqual("Set from template")

            // WHEN add document is selected
            newDoc.dispatchEvent(new Event('click', { bubbles: true }))

            // THEN WHEN create brick template document is selected
            let newTemplateToolbox = document.querySelector("#node-set-from-template-toolbox span") as HTMLSpanElement
            expect(newTemplateToolbox).toBeTruthy()
            expect(newTemplateToolbox.innerText).toEqual("Toolbox")

            newTemplateToolbox.dispatchEvent(new Event('click', { bubbles: true }))

            // EXPECT modal to pick module is selected
            let modalView = document.querySelector("#modal-select-module")
            expect(modalView).toBeTruthy()

            let inputToolboxIdView = document.querySelector("#toolbox-id input") as any as TextInput.View
            expect(inputToolboxIdView).toBeTruthy()
            inputToolboxIdView.state.value$.next("TestToolbox")

            let okBtn = document.querySelector("#modal-select-module button")
            expect(okBtn).toBeTruthy()
            okBtn.dispatchEvent(new Event('click', { bubbles: true }))

            // EXPECT new children added for 'test module 0' & 'test module 1'
            // setTimeout to put the check at the very end of the remaining coroutines list
            setTimeout(
                () => {
                    let spans = Array.from(document.querySelectorAll("span"))
                        .map(s => s.innerText)
                        .filter(text => text.includes("test module"))

                    expect(spans).toEqual(['test module 0', 'test module 1'])

                    Client.getChildren$(
                        storyId,
                        { parentDocumentId: "root-test-story" })
                        .subscribe((documents) => {
                            expect(documents.length).toEqual(5)
                            expect(documents[3].title).toEqual("test module 0")
                            expect(documents[4].title).toEqual("test module 1")
                            done()
                        }), 0
                })
        })
})
