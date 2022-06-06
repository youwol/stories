import { forkJoin, from, Observable, of, OperatorFunction } from 'rxjs'
import {
    AssetsGateway,
    HTTPError,
    AssetsBackend,
    StoriesBackend,
} from '@youwol/http-clients'
import { map, mapTo, mergeMap, tap } from 'rxjs/operators'

import {
    CdnMessageEvent,
    fetchLoadingGraph,
    LoadingScreenView,
} from '@youwol/cdn-client'
import { ChildApplicationAPI } from '@youwol/os-core'
import { child$ } from '@youwol/flux-view'

export function defaultStoryTitle() {
    return 'tmp-story'
}

export function handleError<T>({
    browserContext,
}: {
    browserContext: string
}): OperatorFunction<T | HTTPError, T> {
    return (source$: Observable<T | HTTPError>) => {
        return source$.pipe(
            tap((resp: T | HTTPError) => {
                if (resp instanceof HTTPError) {
                    console.error(`HTTPError$ while ${browserContext}`, resp)
                    throw resp
                }
            }),
            map((d) => d as T),
        )
    }
}

/**
 *
 * @param storyId id of the story to load
 * @param container where to insert the main view
 * @param loadingScreen loading screen to append loading events
 * @param loadPlugins if true, load stories' plugins
 * @returns application state & application view
 */
export function load$(
    storyId: string,
    container: HTMLElement,
    loadingScreen: LoadingScreenView,
    loadPlugins: boolean = true,
): Observable<{
    story: StoriesBackend.StoryResponse
    rootDocument: StoriesBackend.GetDocumentResponse
    globalContents: StoriesBackend.GetGlobalContentResponse
    permissions
}> {
    container.innerHTML = ''

    const client = new AssetsGateway.AssetsGatewayClient()
    loadingScreen.next(new CdnMessageEvent('fetch_story', 'Fetch story...'))
    loadingScreen.next(
        new CdnMessageEvent('fetch_root', 'Fetch root document...'),
    )
    loadingScreen.next(
        new CdnMessageEvent(
            'fetch_global_contents',
            'Fetch global contents document...',
        ),
    )
    loadingScreen.next(
        new CdnMessageEvent('fetch_access', 'Retrieve access...'),
    )
    return forkJoin([
        client.stories.getStory$({ storyId }).pipe(
            handleError({
                browserContext: 'load$ > client.raw.story.getStory$',
            }),
            tap(() =>
                loadingScreen.next(
                    new CdnMessageEvent('fetch_story', 'Fetch story...done'),
                ),
            ),
            mergeMap((story: StoriesBackend.StoryResponse) => {
                if (!story.requirements.loadingGraph || !loadPlugins) {
                    return of(story)
                }
                return from(
                    fetchLoadingGraph(
                        story.requirements.loadingGraph as any,
                        window,
                        {},
                        (event) => {
                            loadingScreen.next(event)
                        },
                    ),
                ).pipe(mapTo(story))
            }),
        ),
        client.stories.getGlobalContents$({ storyId }).pipe(
            handleError({
                browserContext: 'load$ > client.stories.getGlobalContents$',
            }),
            tap(() =>
                loadingScreen.next(
                    new CdnMessageEvent(
                        'fetch_global_contents',
                        'Fetch global contents...done',
                    ),
                ),
            ),
        ),
        client.stories
            .queryDocuments$({ storyId: storyId, parentDocumentId: storyId })
            .pipe(
                handleError({
                    browserContext: 'load$ > client.raw.story.queryDocuments$',
                }),
                tap(() =>
                    loadingScreen.next(
                        new CdnMessageEvent(
                            'fetch_root',
                            'Fetch root document...done',
                        ),
                    ),
                ),
                map((resp) => resp.documents[0]),
            ),
        client.assets.queryAccessInfo$({ assetId: btoa(storyId) }).pipe(
            handleError({ browserContext: 'load$ > client.assets.getAccess$' }),
            tap(() =>
                loadingScreen.next(
                    new CdnMessageEvent(
                        'fetch_access',
                        'Retrieve access...done',
                    ),
                ),
            ),
            map(
                (access: AssetsBackend.QueryAccessInfoResponse) =>
                    access.consumerInfo.permissions,
            ),
        ),
    ]).pipe(
        tap(() => loadingScreen.done()),
        map(([story, globalContents, rootDocument, permissions]) => ({
            story,
            globalContents,
            rootDocument,
            permissions,
        })),
    )
}

/**
 *
 * @param container where to insert the main view
 * @param loadingScreen loading screen to append loading events
 * @returns application state & application view
 */
/*
export function new$(
    container: HTMLElement,
    loadingScreen: LoadingScreenView,
): Observable<{ appState: AppState; appView: AppView }> {
    container.innerHTML = ''

    const client = new AssetsGateway.AssetsGatewayClient()
    loadingScreen.next(
        new CdnMessageEvent('create-tmp-story', 'Create temporary story...'),
    )

    return client.explorer.getDefaultUserDrive$().pipe(
        handleError({
            browserContext: 'create$ > client.explorer.getDefaultUserDrive$',
        }),
        mergeMap((defaultDrive) => {
            return client.assets.story
                .create$(defaultDrive.downloadFolderId, {
                    title: defaultStoryTitle(),
                    storyId: 'tmp-story',
                })
                .pipe(
                    handleError({
                        browserContext: 'create$ > client.assets.story.create$',
                    }),
                )
        }),
        tap(() => {
            loadingScreen.next(
                new CdnMessageEvent(
                    'create-tmp-story',
                    'Create temporary story...done',
                ),
            )
        }),
        mergeMap((asset) => {
            return load$(asset.rawId, container, loadingScreen)
        }),
    ) as Observable<{ appState: AppState; appView: AppView }>
}
 */
export function setApplicationProperties({
    mode,
}: {
    mode: 'reader' | 'writer'
}) {
    const storyId = new URLSearchParams(window.location.search).get('id')
    ChildApplicationAPI.setProperties({
        snippet: {
            class: 'd-flex align-items-center px-1',
            children: [
                {
                    class: `px-1 fas ${mode == 'reader' ? 'fa-eye' : 'fa-pen'}`,
                },
                child$(
                    new AssetsGateway.Client().assets
                        .getAsset$({ assetId: window.btoa(storyId) })
                        .pipe(
                            handleError({
                                browserContext: 'setApplicationProperties',
                            }),
                        ),
                    (asset) => {
                        return {
                            innerText: asset.name,
                        }
                    },
                ),
            ],
        },
    })
}
