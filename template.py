import shutil
from pathlib import Path

from youwol.pipelines.pipeline_typescript_weback_npm import Template, PackageType, Dependencies, \
    RunTimeDeps, generate_template, DevServer
from youwol_utils import parse_json

folder_path = Path(__file__).parent

pkg_json = parse_json(folder_path / 'package.json')


template = Template(
    path=folder_path,
    type=PackageType.Application,
    name=pkg_json['name'],
    version=pkg_json['version'],
    shortDescription=pkg_json['description'],
    author=pkg_json['author'],
    dependencies=Dependencies(
        runTime=RunTimeDeps(
            load={
                '@youwol/os-core': '^0.1.1',
                '@youwol/fv-tree': '^0.2.3',
                '@youwol/os-top-banner': '^0.1.1',
                '@youwol/cdn-client': '^1.0.2',
                '@youwol/http-clients': '^1.0.2',
                '@youwol/flux-view': '^1.0.3',
                '@youwol/fv-context-menu': '^0.1.1',
                'rxjs': '^6.5.5',
                # do not '^' this version : latter versions have some changes in module definition
                'grapesjs': '0.18.3',
            },
            differed={
                'codemirror': '^5.52.0',
            }
        ),
        devTime={
        }
    ),
    userGuide=True,
    devServer=DevServer(
        port=3001
    )
)

generate_template(template)

shutil.copyfile(
    src=folder_path / '.template' / 'src' / 'auto-generated.ts',
    dst=folder_path / 'src' / 'auto-generated.ts'
)

for file in ['README.md', '.gitignore', '.npmignore', '.prettierignore', 'LICENSE', 'package.json',
             'tsconfig.json', 'webpack.config.ts']:
    shutil.copyfile(
        src=folder_path / '.template' / file,
        dst=folder_path / file
    )


