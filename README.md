# Stories

The [**Stories** application](https://platform.youwol.com/applications/@youwol/stories/latest) is a 
hierarchical document editor. 

User guide can be found [here](https://l.youwol.com/doc/@youwol/stories).

Developers' documentation, coverage and bundle's analysis can be found
[here](https://platform.youwol.com/applications/@youwol/cdn-explorer/latest?package=@youwol/stories).

## Installation, Build & Test

To install the required dependencies:

```shell
yarn
```
---
To build for development:

```shell
yarn build:dev
```

To build for production:

```shell
yarn build:prod
```
---
Tests require [py-youwol](https://l.youwol.com/doc/py-youwol)
to run on port 2001 using the configuration defined [here](https://github.com/youwol/integration-tests-conf).

```shell
yarn test
```
---
To start the 'dev-server':
- add `CdnOverride(packageName="@youwol/stories", port=3001)` in your
  [YouWol configuration file](https://l.youwol.com/doc/py-youwol/configuration)
  (in the `dispatches` list).
- run [py-youwol](https://l.youwol.com/doc/py-youwol)
- then execute
  ```shell
  yarn start
  ```

Then, browse to the url `http://localhost:2000/applications/@youwol/stories/latest`
> the port `2000` is the default port for py-youwol, it can be redefined in your py-youwol's configuration file.
---

To generate code documentation:

```shell
yarn doc
```
