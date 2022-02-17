import * as grapesjs from 'grapesjs'

export function applyPatches(editor: grapesjs.Editor) {
    /** the default move command is patched such that it is allow to drag only  if
     * the dedicated 'move' icon is used. Mixing dragging inside the component w/ layout change + internal
     * component behavior was causing problem
     */
    const defaultMove = editor.Commands.get('tlb-move')
    editor.Commands.add('tlb-move', {
        run(ed, sender, opts = {}) {
            /* If the dedicated icon is used => opts["event"].target is not defined */
            if (opts && opts['event'] && opts['event'].target) {
                return
            }
            defaultMove.run(ed, sender, opts)
        },
    })

    /* --- Those next four lines are hacky, it ensures the attributes and styles panels are not displayed at first
    This problem seems to occur only for light workflow
    -----*/
    editor.Commands.run('show-attributes')
    editor.Commands.stop('show-attributes')
    editor.Commands.run('show-styles')
    editor.Commands.stop('show-styles')
    editor.Commands.run('show-traits')
    editor.Commands.stop('show-traits')
    editor.Commands.run('show-layers')
    editor.Commands.stop('show-layers')
}
