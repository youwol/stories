/** @format */

import * as grapesjs from 'grapesjs'

export function plugCommands(editor: grapesjs.Editor) {
    editor.Commands.add('show-blocks', {
        getRowEl() {
            return editor.getContainer().closest('#editor-row')
        },
        getLayersEl(row) {
            return row.querySelector('#blocks')
        },

        run() {
            const lmEl = this.getLayersEl(this.getRowEl(editor))
            lmEl.style.display = ''
        },
        stop() {
            const lmEl = this.getLayersEl(this.getRowEl(editor))
            lmEl.style.display = 'none'
        },
    })
    editor.Commands.add('show-styles', {
        getRowEl() {
            return editor.getContainer().closest('#editor-row')
        },
        getStyleEl(row) {
            return row.querySelector('#styles')
        },

        run() {
            const smEl = this.getStyleEl(this.getRowEl(editor))
            smEl.style.display = ''
        },
        stop() {
            const smEl = this.getStyleEl(this.getRowEl(editor))
            smEl.style.display = 'none'
        },
    })
    editor.Commands.add('show-layers', {
        getRowEl() {
            return editor.getContainer().closest('#editor-row')
        },
        getLayersEl(row) {
            return row.querySelector('#layers')
        },

        run() {
            const smEl = this.getLayersEl(this.getRowEl(editor))
            smEl.style.display = ''
        },
        stop() {
            const smEl = this.getLayersEl(this.getRowEl(editor))
            smEl.style.display = 'none'
        },
    })
    editor.Commands.add('show-traits', {
        getRowEl() {
            return editor.getContainer().closest('#editor-row')
        },
        getTraitsEl(row) {
            return row.querySelector('#traits')
        },

        run() {
            const smEl = this.getTraitsEl(this.getRowEl(editor))
            smEl.style.display = ''
        },
        stop() {
            const smEl = this.getTraitsEl(this.getRowEl(editor))
            smEl.style.display = 'none'
        },
    })
    editor.Commands.add('open-code', {
        getRowEl() {
            return editor.getContainer().closest('#editor-row')
        },
        getCodeEl(row) {
            return row.querySelector('#codes')
        },

        run: function () {
            const div = this.getCodeEl(this.getRowEl(editor))
            console.log('Code elements', div)

            console.log('Code Panel', this.codePanel)
            this.codePanel.style.display = 'block'
            div.appendChild(this.codePanel)
        },
        stop: function () {
            if (this.codePanel) {
                this.codePanel.style.display = 'none'
            }
        },
    })

    editor.Commands.add('set-device-tablet', {
        run() {
            editor.setDevice('Tablet')
        },
        stop() {
            /*no op, but required => do not remove*/
        },
    })
    editor.Commands.add('set-device-desktop', {
        run() {
            editor.setDevice('Desktop')
        },
        stop() {
            /*no op, but required => do not remove*/
        },
    })
    editor.Commands.add('set-device-mobile-landscape', {
        run() {
            editor.setDevice('Mobile landscape')
        },
        stop() {
            /*no op, but required => do not remove*/
        },
    })
    editor.Commands.add('set-device-mobile-portrait', {
        run(_editor, _sender) {
            editor.setDevice('Mobile portrait')
        },
        stop(_editor, _sender) {
            /*no op, but required => do not remove op*/
        },
    })
    editor.on('run:preview:before', ({ sender }: { sender }) => {
        sender.panelRight = document.getElementById('panel__right')
        sender.panelRight.remove()
    })
    editor.on('stop:preview:before', ({ sender }: { sender }) => {
        if (sender && sender.panelRight) {
            document.getElementById('editor-row').appendChild(sender.panelRight)
        }
    })
}
