# Дедупликация Альтернативных Путей

## Проблема

При исследовании различных альтернативных путей в PDA симуляторе возникало две проблемы:

1. **Повторяющиеся пути**: Одинаковые пути могли добавляться в список результатов несколько раз
2. **Пути-префиксы**: Неполные пути, которые являются началом других путей, добавлялись отдельно вместо того, чтобы быть удаленными

Это приводило к:
- Повторению одинаковых путей в списке альтернативных ветвей
- Показу неполных путей (заканчивающихся посередине) вместе с полными путями
- Неправильному подсчету количества уникальных путей
- Запутанности пользователя при просмотре результатов

## Решение

Добавлены три метода в класс `PDASimulator`:

### 1. `serializePath(path)`
Преобразует путь в уникальную строку-идентификатор для сравнения:
```javascript
serializePath(path) {
  return path.map(step => 
    `${step.state}|${step.input}|${(step.stack || []).join(',')}|${step.status}`
  ).join('::');
}
```

Включает в идентификатор:
- Текущее состояние (state)
- Оставшуюся входную строку (input)
- Содержимое стека (stack)
- Статус шага (status)

### 2. `isPathPrefix(shortPath, longPath)`
Проверяет, является ли один путь префиксом (началом) другого:
```javascript
isPathPrefix(shortPath, longPath) {
  if (shortPath.length >= longPath.length) return false;
  
  for (let i = 0; i < shortPath.length; i++) {
    const shortStep = shortPath[i];
    const longStep = longPath[i];
    
    if (shortStep.state !== longStep.state ||
        shortStep.input !== longStep.input ||
        (shortStep.stack || []).join(',') !== (longStep.stack || []).join(',') ||
        shortStep.status !== longStep.status) {
      return false;
    }
  }
  
  return true;
}
```

Если путь 1 является префиксом пути 2, это означает, что путь 1 был бы продолжен в пути 2, если бы его исследование продолжилось.

### 3. `deduplicatePaths(allPaths)`
Удаляет дубликаты и пути-префиксы из списка путей:
```javascript
deduplicatePaths(allPaths) {
  // Шаг 1: Удаляем точные дубликаты
  const seenPaths = new Set();
  const uniquePaths = [];
  
  for (const pathObj of allPaths) {
    const serialized = this.serializePath(pathObj.path);
    if (!seenPaths.has(serialized)) {
      seenPaths.add(serialized);
      uniquePaths.push(pathObj);
    }
  }
  
  // Шаг 2: Удаляем пути-префиксы других путей
  const result = [];
  for (const pathObj of uniquePaths) {
    let isPrefixOfAnother = false;
    
    for (const otherPathObj of uniquePaths) {
      if (pathObj === otherPathObj) continue;
      if (this.isPathPrefix(pathObj.path, otherPathObj.path)) {
        isPrefixOfAnother = true;
        break;
      }
    }
    
    if (!isPrefixOfAnother) {
      result.push(pathObj);
    }
  }
  
  return result;
}
```

## Применение

В методе `simulate()` после исследования всех путей:
```javascript
const uniquePaths = this.deduplicatePaths(allPaths);

return {
  accepted: result.accepted,
  path: result.accepted ? result.path : (uniquePaths.length > 0 ? uniquePaths[0].path : initialPath),
  allPaths: result.accepted ? [] : uniquePaths,  // <- используются уникальные пути
  reason: result.reason
};
```

## Результат

✅ Точные дубликаты удаляются (одинаковые пути не повторяются)
✅ Пути-префиксы удаляются (неполные пути, начинающиеся также как полные, не показываются)
✅ Правильный подсчет количества уникальных альтернативных путей
✅ Пользователь видит только полные и независимые пути без дубликатов
✅ Не показываются пути, которые заканчиваются посередине (они являются префиксами других путей)

## Тестирование

Проверены различные сценарии:
- **Палиндромы с несколькими вариантами распределения символов** (например: "aabbaa")
- **Строки, которые не проходят** (например: "aabbaab") - показываются только полные ветви исследования, неполные пути-префиксы удаляются
- **Грамматики с недетерминизмом** - множественные переходы для одного состояния и символа обрабатываются корректно
- **Строки, где один путь является началом другого** - короткий путь удаляется, показывается только полный путь

## Пример

Для строки "aabbaab", которая должна быть отклонена:
- Вместо множества путей-префиксов, заканчивающихся в разных местах
- Показываются только те полные пути, которые не являются началом других путей
- Каждый показанный путь - это самостоятельное исследование ветви, которое привело к отказу

Все пути теперь отображаются без дубликатов, и их количество соответствует действительному числу уникальных и полных альтернативных путей.
