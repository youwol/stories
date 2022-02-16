import { child$, VirtualDOM } from '@youwol/flux-view'
import { Tabs } from '@youwol/fv-tabs'
import { Subject } from 'rxjs'
import { Client } from '../client/client'
import { modalView } from './commons.view'

function emojisListView(emojiList, insertedEmojis$): VirtualDOM {
    const icons = emojiList.map((char: string) => {
        return {
            tag: 'label',
            innerText: char.replace(/&zwj;/g, ''),
            class: 'p-1 rounded fv-pointer fv-hover-bg-focus emojis-modal-view-item',
            onclick: (ev) => {
                insertedEmojis$.next(ev.srcElement.innerText)
            },
        }
    })
    return {
        class: 'fv-bg-background-alt rounded overflow-auto w-100 h-100',
        children: icons,
    }
}

export function popupEmojisBrowserModal(insertedEmojis$: Subject<string>) {
    const tabState = new Tabs.State([
        new Tabs.TabData('smileys_people', '😃'),
        new Tabs.TabData('animals', '🐻'),
        new Tabs.TabData('foods', '🍔'),
        new Tabs.TabData('activities', '⚽'),
        new Tabs.TabData('travel', '🌇'),
        new Tabs.TabData('objects', '💡'),
        new Tabs.TabData('symbols', '🔣'),
        new Tabs.TabData('flags', '🎌'),
    ])
    const tabView = new Tabs.View({
        state: tabState,
        contentView: (state, tab) => {
            return {
                style: { aspectRatio: '2' },
                children: [
                    child$(
                        Client.getEmojis$(tab.id),
                        ({ emojis }: { emojis: Array<any> }) => {
                            return emojisListView(emojis, insertedEmojis$)
                        },
                    ),
                ],
            }
        },
        headerView: (state, tab) => {
            return {
                class: 'px-2 rounded',
                innerText: tab.name,
            }
        },
    })
    const view = modalView(insertedEmojis$, tabView)
    return view.state.ok$
}
