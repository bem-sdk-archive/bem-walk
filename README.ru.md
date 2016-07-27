# bem-walk

## Что это?

Инструмент обходит файловую систему БЭМ-проекта и возвращает информацию о найденных файлах.

## Установка

```
$ npm install --save bem-walk
```
Для работы требуется Node.js 4.0+.

## Быстрый старт

Пример файловой системы БЭМ-проекта:

```files
common.blocks/            # Уровень проекта
libs/
    bem-core/             # Уровень библиотеки `bem-core`
        common.blocks/    
```

Прежде чем использовать `bem-walk`, необходимо описать уровни файловой системы в объекте `config`:

```js
  var config = {
        // cписок уровней
        levels: {
            'lib/bem-core/common.blocks': { naming: 'origin' },
            'common.blocks': { scheme: 'nested' }
        }
    };
```
* `naming` — схема именования файлов.
* `scheme` — схема файловой структуры.

Подробнее:
* [bem-naming](https://ru.bem.info/toolbox/sdk/bem-naming/);
* [bem-fs-scheme](https://ru.bem.info/toolbox/sdk/bem-fs-scheme/).

```js
var walk = require('bem-walk'),
    config = {
        // уровни проекта
        levels: {
            'lib/bem-core/common.blocks': { naming: 'origin' },
            'common.blocks': { naming: 'origin' }
        }
    },
    files = [];

var stream = walk([
    'libs/bem-core/common.blocks',
    'common.blocks'
], config);

stream.on('data', file => files.push(file));

stream.on('error', console.error);

stream.on('end', () => console.log(files));
```

**Важно!**  Описывать все уровни проекта вручную необязательно, можно воспользоваться пакетом [`bem-config`](https://ru.bem.info/toolbox/sdk/bem-config/).

```js
var config = require('bem-config')();
var levelMap = config.levelMapSync();
console.log(levelMap);
```

## API

### walk()

#### Описание

`walk(levels, config);`

#### Входные параметры

**levels**

Тип: string[]

Описание: пути для обхода.

```js
[
 'lib/bem-core/common.blocks',
 'common.blocks'
]
```
Можно использовать абсолютный URL, например, так:

```js
[
 '//www.cosmofarm.ru/lib/bem-core/common.blocks',
 '//www.cosmofarm.ru/common.blocks'
]
```
**config**

Тип: object

Описание: уровни проекта.

#### Возвращает

Поток с возможностью чтения (`stream.Readable`), который имеет следующие события:

##### Событие: 'data'

Передаёт обработчику JavaScript-объект, содержащий информацию о найденном файле:

В JSON-интерфейсе:

```js
{
    entity: { block: "page" },
    level: "libs/bem-core/desktop.blocks",
    tech: "bemhtml",
    path: "libs/bem-core/desktop.blocks/page/page.bemhtml.js"
}
```

* `entity` — БЭМ-сущность;
* `level`  — путь к уровню;
* `tech`   — технология реализации;
* `path`   — относительный путь к файлу;

##### Событие: 'end'

Генерируется, когда `bem-walk` заканчивает обход всех уровней, описанных в объекте `levels`.

##### Событие: 'error'

Генерируется, если при обходе уровней произошла ошибка.

## Примеры использования

### Группировка

```js
var walk = require('bem-walk'),
    config = {
        // уровни проекта
        levels: {
            'lib/bem-core/common.blocks': { naming: 'origin' },
            'common.blocks': { naming: 'origin' }
        }
    },
    groups = {};

var stream = walk([
    'libs/bem-core/common.blocks',
    'common.blocks'
], config);

stream.on('data', file => (groups[file.entity.block] = []).push(file));

stream.on('error', console.error);

stream.on('end', () => console.log(groups));
```

### Фильтрация

```js
var walk = require('bem-walk'),
    config = {
        // уровни проекта
        levels: {
            'lib/bem-core/common.blocks': { naming: 'origin' },
            'common.blocks': { naming: 'origin' }
        }
    },
    files = [];

var stream = walk([
    'libs/bem-core/common.blocks',
    'common.blocks'
], config);

stream.on('data', function(file) {
    if (file.entity.block !== 'button') {
        files.push(file);
    }  
});

stream.on('error', console.error);

stream.on('end', () => console.log(files));

```

### Трансформация

```js
var walk = require('bem-walk'),
    stringify = require('JSONStream').stringify,
    through2 = require('through2'),
    fs = require('fs'),
    config = {
        // уровни проекта
        levels: {
            'lib/bem-core/common.blocks': { naming: 'origin' },
            'common.blocks': { naming: 'origin' }
        }
    },
    files = [];

var stream = walk([
    'libs/bem-core/common.blocks',
    'common.blocks'
], config);


stream.pipe(through2.obj(function (file, enc, callback) {
    file.source = fs.readFileSync(file.path).toString('utf-8');
    this.push(file);

    callback();
}))
    .pipe(stringify())
    .pipe(process.stdout);
```
