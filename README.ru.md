# bem-walk

Инструмент позволяет обойти файловую систему БЭМ-проекта и получить следующую информацию о найденных файлах:

* тип БЭМ-сущности (Блок, Элемент, Модификатор);
* технология реализации;
* расположение на файловой системе.

## Быстрый старт

### Шаг 1. Установите bem-walk

```
$ npm install --save bem-walk
```

Для работы требуется Node.js 4.0+.

### Шаг 2. Подключите bem-walk

Прежде чем использовать `bem-walk`, необходимо создать JavaScript-файл и добавить строку следующего вида:

```js
var walk = require('bem-walk');
```

### Шаг 3. Опишите уровни файловой системы

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

**Примечание**  Для каждого описываемого уровня указывается используемая схема именования файлов или схема файловой системы. Это позволяет при обходе получать информацию о БЭМ-сущностях по их именам или по схеме организации файловой системы на данном уровне.

Если при описании уровня схема не указана, используются:
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

### Шаг 4. Опишите пути для обхода

Возможные варианты:

* относительно корневого каталога

  ```js
  var levels = [
      'libs/bem-core/common.blocks',
      'common.blocks'
  ];
  ```

* абсолютные

  ```js
  var levels = [
      '/path/to/project/lib/bem-core/common.blocks',
      '/path/to/project/common.blocks'
  ];
  ```

### Шаг 5. Получите информацию о найденных файлах

Передайте методу walk() объекты `levels` и `config`.

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

### walk()

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

Передает обработчику JavaScript-объект, содержащий информацию о найденном файле.

В JSON-интерфейсе:

```js
{
    "entity": { "block": "page" },
    "level": "libs/bem-core/desktop.blocks",
    "tech": "bemhtml",
    "path": "libs/bem-core/desktop.blocks/page/page.bemhtml.js"
}
```

* `entity` — БЭМ-сущность;
* `level`  — путь к уровню;
* `tech`   — технология реализации;
* `path`   — относительный путь к файлу.

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
    // Создание свойства source объекта file
    file.source = fs.readFileSync(file.path).toString('utf-8');
    this.push(file);

    callback();
}))
    .pipe(stringify())
    .pipe(process.stdout);
```
