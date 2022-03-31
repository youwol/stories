import { forkJoin, from, Observable, of, OperatorFunction } from 'rxjs'
import { AssetsGateway, HTTPError } from '@youwol/http-clients'
import { map, mapTo, mergeMap, tap } from 'rxjs/operators'

import {
    CdnMessageEvent,
    fetchLoadingGraph,
    LoadingScreenView,
} from '@youwol/cdn-client'
import {
    DocumentResponse,
    StoryResponse,
} from '@youwol/http-clients/dist/lib/assets-gateway'

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
 * @returns application state & application view
 */
export function load$(
    storyId: string,
    container: HTMLElement,
    loadingScreen: LoadingScreenView,
): Observable<{
    story: StoryResponse
    rootDocument: DocumentResponse
    permissions
}> {
    container.innerHTML = ''

    const client = new AssetsGateway.AssetsGatewayClient()
    loadingScreen.next(new CdnMessageEvent('fetch_story', 'Fetch story...'))
    loadingScreen.next(
        new CdnMessageEvent('fetch_root', 'Fetch root document...'),
    )
    loadingScreen.next(
        new CdnMessageEvent('fetch_access', 'Retrieve access...'),
    )

    return forkJoin([
        client.raw.story.getStory$(storyId).pipe(
            handleError({
                browserContext: 'load$ > client.raw.story.getStory$',
            }),
            tap(() =>
                loadingScreen.next(
                    new CdnMessageEvent('fetch_story', 'Fetch story...done'),
                ),
            ),
            mergeMap((story: StoryResponse) => {
                if (!story.requirements.loadingGraph) {
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
        client.raw.story.queryDocuments$(storyId, storyId).pipe(
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
        client.assets.getAccess$(btoa(storyId)).pipe(
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
                (access: AssetsGateway.AccessInfo) =>
                    access.consumerInfo.permissions,
            ),
        ),
    ]).pipe(
        tap(() => loadingScreen.done()),
        map(([story, rootDocument, permissions]) => ({
            story,
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
