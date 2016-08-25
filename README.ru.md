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

**Примечание** Для работы с `bem-walk` требуется установить Node.js 4.0+.

### 1. Установите bem-walk

```
$ npm install --save bem-walk
```

### 2. Подключите bem-walk

Создайте JavaScript-файл с произвольным именем и добавьте строку следующего вида:

```js
var walk = require('bem-walk');
```

### 3. Опишите уровни файловой системы

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

**Примечание**  Для каждого уровня указывается схема именования файлов или организации файловой системы. Это позволяет при обходе получать информацию о БЭМ-сущностях [по их именам](https://ru.bem.info/toolbox/sdk/bem-naming/#Строковое-представление) или по именам файлов и директорий.

|  Схема | Значение по умолчанию | Все возможные значения |
|----------|-----|----------|
|`naming` — схема именования файлов.|`origin`| `origin`, `two-dashes`|
|`sheme` — cхема файловой системы.|`nested`|`nested`, `flat`|

Подробнее:
* [bem-naming](https://ru.bem.info/toolbox/sdk/bem-naming/);
* [bem-fs-scheme](https://ru.bem.info/toolbox/sdk/bem-fs-scheme/).

**Примечание** Чтобы не определять уровни проекта вручную, воспользуйтесь инструментом [`bem-config`](https://ru.bem.info/toolbox/sdk/bem-config/).

```js
var config = require('bem-config')();
var levelMap = config.levelMapSync();
var stream = walk(levels, levelMap);
```

### 4. Опишите пути обхода

Укажите пути обхода в объекте `levels`.

Возможные варианты:

* Относительно корневого каталога.

  ```js
  var levels = [
      'libs/bem-core/common.blocks',
      'common.blocks'
  ];
  ```

* Абсолютные.

  ```js
  var levels = [
      '/path/to/project/lib/bem-core/common.blocks',
      '/path/to/project/common.blocks'
  ];
  ```

### 5. Получите информацию о найденных файлах

Передайте методу walk() объекты `levels` и `config`.

Для получения данных о найденных файлах используется поток (stream). Когда порция данных получена, генерируется событие `data` и информация о найденном файле добавляется в массив `files`. При возникновении ошибки `bem-walk` прекращает обработку запроса и возвращает ответ, содержащий идентификатор ошибки и ее описание. Событие `end` наступает при окончании получения данных из потока.

```js
var files = [];

var stream = walk(levels, config);

stream.on('data', file => files.push(file)); // добавляем информацию о найденном файле в конец массива files

stream.on('error', console.error);

stream.on('end', () => console.log(files));
```

[Подробнее о возвращаемых данных](#Выходные-данные).

В результате выполненных действий полный код JavaScript-файла должен иметь следующий вид:

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

`walk(levels, config);`

#### Описание

Обходит директории описанные в параметре `levels` и возвращает поток `stream.Readable`.

#### Входные параметры

Требования к поиску определяются параметрами `levels` и `config`. Параметры нельзя передавать в любой последовательности.

| Параметр | Тип | Описание |
|----------|-----|----------|
|**levels**|`string[]`|Пути обхода|
|**config**|`object`|Уровни проекта|

#### Выходные данные

Поток с возможностью чтения (`stream.Readable`), который имеет следующие события:

| Событие | Описание |
|----------|-----|
|'data'|Возвращается JavaScript-объект с информацией о найденном файле. </br></br> Ниже рассмотрен JSON-интерфейс, включающий элементы, которые входят в ответ метода `walk`. Объекты и ключи приведены с примерами значений. </br></br> **Пример** </br></br><code>{</code></br><code>"entity": { "block": "page" },</code></br><code>"level": "libs/bem-core/desktop.blocks",</code></br><code>"tech": "bemhtml",</code></br><code>"path": "libs/bem-core/desktop.blocks/page/page.bemhtml.js"</code></br><code>}</code></br></br>`entity` — БЭМ-сущность;</br> `level` — путь к директории;</br> `tech` — технология реализации;</br> `path` — относительный путь к файлу.|
| 'error' | Генерируется, если при обходе уровней произошла ошибка. Возвращается объект с описанием ошибки.|
| 'end' | Генерируется, когда `bem-walk` заканчивает обход уровней, описанных в объекте `levels`. |

## Примеры использования

Типовые задачи, решаемые с полученными JavaScript-объектами:
* [Группировка](#Группировка).
* [Фильтрация](#Фильтрация).
* [Трансформация имеющихся данных](#Трансформация).

### Группировка

```js
var walk = require('bem-walk'),
    config = {
        // уровни проекта
        levels: {
            'lib/bem-components/common.blocks': { naming: 'origin' },
            'common.blocks': { naming: 'origin' }
        }
    },
    groups = {};
const util = require('util');

var stream = walk([
    'libs/bem-components/common.blocks',
    'common.blocks'
], config);

stream.on('data', file => (groups[file.entity.block] = []).push(file));

stream.on('error', console.error);

stream.on('end', () => console.log(util.inspect(groups, { depth: null })));

/*
{ button:
   [ { entity: { block: 'button', modName: 'togglable', modVal: 'radio' },
       tech: 'spec.js',
       path: 'libs/bem-components/common.blocks/button/_togglable/button_togglable_radio.spec.js',
       level: 'libs/bem-components/common.blocks' } ],
 ...
}
*/
```

### Фильтрация

```js
var walk = require('bem-walk'),
    config = {
         // уровни проекта
        levels: {
            'lib/bem-components/common.blocks': { naming: 'origin' },
            'common.blocks': { naming: 'origin' }
        }
    },
    files = [];

var stream = walk([
    'libs/bem-components/common.blocks',
    'common.blocks'
], config);

stream.on('data', function(file) {
    if (file.entity.block == 'popup') {
        files.push(file);
    }  
});

stream.on('error', console.error);

stream.on('end', () => console.log(files));

/*
[{ entity: { block: 'popup', modName: 'target', modVal: true },
   tech: 'js',
   path: 'libs/bem-components/common.blocks/popup/_target/popup_target.js',
   level: 'libs/bem-components/common.blocks' },
...
]
*/
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
            'lib/bem-components/common.blocks': { naming: 'origin' },
            'common.blocks': { naming: 'origin' }
        }
    };

var stream = walk([
    'libs/bem-components/common.blocks',
    'common.blocks'
], config);

stream.pipe(through2.obj(function (file, enc, callback) {
    // Создание свойства source объекта file
    if(fs.statSync(file.path).isFile()) {
        file.source = fs.readFileSync(file.path, 'utf-8');
    }

    this.push(file);
    callback();
}))
    .pipe(stringify())
    .pipe(process.stdout);

/*
[{"entity":{"block":"search","elem":"header"},
  "tech":"css",
  "path":"common.blocks/search/__header/search__header.css",
  "level":"common.blocks",
  "source":".search__header {\n\tdisplay: block;\n\tfont-size: 20px;\n\tcolor: rgba(0,0,0,0.84);\n\tmargin: 0;\n\tpadding: 0 0 16px;\n\n}\n\n"},
...
]
*/
```
