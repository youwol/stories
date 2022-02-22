import { child$, VirtualDOM } from '@youwol/flux-view'
import { Tabs } from '@youwol/fv-tabs'
import { Subject } from 'rxjs'
import { modalView } from './commons.view'
import { AssetsGateway } from '@youwol/http-clients'

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
    const client = new AssetsGateway.AssetsGatewayClient()
    const tabView = new Tabs.View({
        state: tabState,
        contentView: (state, tab) => {
            return {
                style: { aspectRatio: '2' },
                children: [
                    child$(
                        client.misc.queryEmojis$(tab.id),
                        ({ emojis }: { emojis: Array<string> }) => {
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
