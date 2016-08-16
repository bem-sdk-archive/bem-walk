# bem-walk

[![NPM Status][npm-img]][npm]
[![Travis Status][test-img]][travis]
[![Windows Status][appveyor-img]][appveyor]
[![Coverage Status][coverage-img]][coveralls]
[![Dependency Status][david-img]][david]

[npm]:          https://www.npmjs.org/package/bem-walk
[npm-img]:      https://img.shields.io/npm/v/bem-walk.svg

[travis]:       https://travis-ci.org/bem-sdk/bem-walk
[test-img]:     https://img.shields.io/travis/bem-sdk/bem-walk.svg?label=tests

[appveyor]:     https://ci.appveyor.com/project/blond/bem-walk
[appveyor-img]: http://img.shields.io/appveyor/ci/blond/bem-walk.svg?style=flat&label=windows

[coveralls]:    https://coveralls.io/r/bem-sdk/bem-walk
[coverage-img]: https://img.shields.io/coveralls/bem-sdk/bem-walk.svg

[david]:        https://david-dm.org/bem-sdk/bem-walk
[david-img]:    http://img.shields.io/david/bem-sdk/bem-walk.svg?style=flat

Инструмент позволяет обойти файловую систему БЭМ-проекта и получить следующую информацию о найденных файлах:

* тип БЭМ-сущности (Блок, Элемент, Модификатор);
* технология реализации;
* расположение на файловой системе.

## Быстрый старт

### Установите bem-walk

```
$ npm install --save bem-walk
```

Для работы требуется Node.js 4.0+.

### Подключите bem-walk

Прежде чем использовать `bem-walk`, необходимо создать JavaScript-файл и добавить строку следующего вида:

```js
var walk = require('bem-walk');
```

### Опишите уровни файловой системы

Опишите уровни файловой системы проекта в объекте `config`.

```js
var config = {
    // уровни проекта
    levels: {
        'lib/bem-core/common.blocks': { naming: 'two-dashes' }, // `naming` — схема именования файлов
        'common.blocks': { sheme: 'nested' } // `scheme` — схема файловой системы
    }
};
```

**Примечание**  Для каждого описываемого уровня указывается используемая схема именования файлов или схема организации файловой системы. Это позволяет при обходе получать информацию о БЭМ-сущностях [по их именам](https://ru.bem.info/toolbox/sdk/bem-naming/#Строковое-представление) или по именам файлов и директорий.

Если при описании уровня схема не указана, по умолчанию используется:
* схема именования файлов `origin`;
* схема файловой системы `nested`.

Подробнее:
* [bem-naming](https://ru.bem.info/toolbox/sdk/bem-naming/);
* [bem-fs-scheme](https://ru.bem.info/toolbox/sdk/bem-fs-scheme/).

**Примечание**  Для того чтобы не определять уровни проекта вручную, воспользуйтесь инструментом [`bem-config`](https://ru.bem.info/toolbox/sdk/bem-config/).

```js
var config = require('bem-config')();
var levelMap = config.levelMapSync();
```

### Опишите пути для обхода

Укажите пути для обхода в объекте `levels`.

Возможные варианты:

* относительно корневого каталога;

  ```js
  var levels = [
      'libs/bem-core/common.blocks',
      'common.blocks'
  ];
  ```

* абсолютные.

  ```js
  var levels = [
      '/path/to/project/lib/bem-core/common.blocks',
      '/path/to/project/common.blocks'
  ];
  ```

### Получите информацию о найденных файлах

Передайте методу walk() объекты `levels` и `config`. Если запрос был обработан без ошибок, генрируется событие `data` и возвращается JavaScript-объект с информацией о найденом файле. Если запрос вызвал ошибку, возвращается объект `error`, содержащий описание ошибки.

```js
var files = [];

var stream = walk(levels, config);

stream.on('data', file => files.push(file)); // добавляем информацию о найденном файле в конец массива files

stream.on('error', console.error);

stream.on('end', () => console.log(files));
```

### Результат

Полный текст примера:

```js
var walk = require('bem-walk'),
    config = {
        // уровни проекта
        levels: {
            'lib/bem-core/common.blocks': { naming: 'origin' },
            'common.blocks': { naming: 'origin' }
        }
    },
    levels = [
        'libs/bem-core/common.blocks',
        'common.blocks'
    ],
    files = [];

var stream = walk(levels, config);

stream.on('data', file => files.push(file));

stream.on('error', console.error);

stream.on('end', () => console.log(files));
```

## API

### Метод walk

Обходит директории описанные в параметре `levels` и возвращает поток `stream.Readable`.

#### Описание

`walk(levels, config);`

#### Входные параметры

| Параметр | Тип | Описание |
|----------|-----|----------|
|**levels**|`string[]`|Пути для обхода|
|**config**|`object`|Уровни проекта|

#### Выходные данные

Метод `walk()` возвращает поток с возможностью чтения (`stream.Readable`), который имеет следующие события:

##### Событие: 'data'

Передает обработчику JavaScript-объект, содержащий информацию о найденном файле. В разделе рассмотрен JSON-интерфейс, включающий все элементы, которые могут войти в ответ метода walk. Объекты и ключи приведены с примерами значений.

**Пример**

```js
{
    "entity": { "block": "page" },
    "level": "libs/bem-core/desktop.blocks",
    "tech": "bemhtml",
    "path": "libs/bem-core/desktop.blocks/page/page.bemhtml.js"
}
```

* `entity` — БЭМ-сущность;
* `level`  — путь к директории;
* `tech`   — технология реализации;
* `path`   — относительный путь к файлу.

##### Событие: 'end'

Генерируется, когда `bem-walk` заканчивает обход всех уровней, описанных в объекте `levels`.

##### Событие: 'error'

Генерируется, если при обходе уровней произошла ошибка.

## Примеры использования

Типичные задачи, решаемые с полученными JavaScript-объектами — группировка, фильтрация, трансформация уже имеющихся данных.

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
    // Создание свойства source объекта file
    file.source = fs.readFileSync(file.path).toString('utf-8');
    this.push(file);

    callback();
}))
    .pipe(stringify())
    .pipe(process.stdout);
```
