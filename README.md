# Stories


Application stories.


## Installation, Build & Test 

To install the required dependencies:

```shell
yarn
```

To build for development:

```shell
yarn build:dev
```

To build for production:

```shell
yarn build:prod
```

Tests require py-youwol to run on port 2001 using the configuration defined [here](https://github.com/youwol/integration-tests-conf).

```shell
yarn test
```

To start the 'dev-server':
- add `CdnOverride(packageName="@youwol/stories", port=3001)` in your yw_config in the `dispatches` list.
- run py-youwol
- then execute
```shell
yarn start
```

To generate code documentation:

```shell
yarn doc
```

## Documentation

Documentation of the library can be found [here](https://platform.youwol.com/applications/@youwol/cdn-explorer/latest?package=@youwol/stories).

