import { forkJoin, from, Observable, of, OperatorFunction } from 'rxjs'
import {
    AssetsGateway,
    AssetsBackend,
    StoriesBackend,
} from '@youwol/http-clients'
import { HTTPError } from '@youwol/http-primitives'
import { map, mapTo, mergeMap, tap } from 'rxjs/operators'

import {
    CdnMessageEvent,
    Client,
    installLoadingGraph,
    LoadingGraph,
    LoadingScreenView,
} from '@youwol/cdn-client'
import { ChildApplicationAPI } from '@youwol/os-core'
import { child$ } from '@youwol/flux-view'

type NewAssetResponse<T> = AssetsGateway.NewAssetResponse<T>
type CreateStoryResponse = StoriesBackend.CreateStoryResponse

export function defaultStoryTitle() {
    return `story-${new Date().toLocaleString()}`
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

export function launch$(loadPlugins: boolean) {
    const storyIdQueryParam = new URLSearchParams(window.location.search).get(
        'id',
    )
    const container = document.getElementById('content')

    return storyIdQueryParam
        ? load$(
              storyIdQueryParam,
              container,
              Client['initialLoadingScreen'],
              loadPlugins,
          )
        : new$(container, Client['initialLoadingScreen'])
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
    loadPlugins = true,
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
                // TODO: http-clients.StoriesBackend need to be updated such that the 'aliases' property
                //  is exposed in `LoadingGraph.lock`. TG-1769
                return from(
                    installLoadingGraph({
                        loadingGraph: story.requirements
                            .loadingGraph as LoadingGraph,
                        onEvent: (event) => {
                            loadingScreen.next(event)
                        },
                    }),
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
export function new$(container: HTMLElement, loadingScreen: LoadingScreenView) {
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
            return client.stories
                .create$({
                    body: {
                        title: defaultStoryTitle(),
                    },
                    queryParameters: { folderId: defaultDrive.tmpFolderId },
                })
                .pipe(
                    handleError({
                        browserContext: 'create$ > client.assets.story.create$',
                    }),
                    map(
                        (resp) => resp as NewAssetResponse<CreateStoryResponse>,
                    ),
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
            return load$(asset.rawId, container, loadingScreen, false)
        }),
    )
}

export function setApplicationProperties({
    storyId,
    mode,
}: {
    storyId: string
    mode: 'reader' | 'writer'
}) {
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
