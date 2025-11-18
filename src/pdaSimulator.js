export class PDASimulator {
  constructor(transitions) {
    this.transitions = transitions.filter(t => 
      t.fromState && t.inputSymbol !== '' && t.stackTop && t.toState && t.stackPush !== ''
    );
  }

  findTransitions(state, inputSymbol, stackTop) {
    return this.transitions.filter(t => 
      t.fromState === state && 
      t.inputSymbol === inputSymbol && 
      t.stackTop === stackTop
    );
  }

  serializePath(path) {
    return path.map(step => 
      `${step.state}|${step.input}|${(step.stack || []).join(',')}|${step.status}`
    ).join('::');
  }

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

  deduplicatePaths(allPaths) {
    const seenPaths = new Set();
    const pathSerializations = new Map();
    const uniquePaths = [];
    
    for (const pathObj of allPaths) {
      const serialized = this.serializePath(pathObj.path);
      if (!seenPaths.has(serialized)) {
        seenPaths.add(serialized);
        pathSerializations.set(serialized, pathObj);
        uniquePaths.push(pathObj);
      }
    }
    
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

  simulate(inputString) {
    const initialStack = ['Z'];
    const initialState = 'q0';
    
    const allPaths = [];
    
    const explore = (state, input, stack, path, depth = 0) => {
      if (depth > 1000) {
        const failPath = [...path, {
          state,
          input,
          stack: [...stack],
          depth,
          transition: null,
          status: 'failed',
          message: 'Превышена максимальная глубина рекурсии (возможно зацикливание)'
        }];
        allPaths.push({
          path: failPath,
          reason: 'Превышена максимальная глубина рекурсии (возможно зацикливание)'
        });
        return { accepted: false, reason: 'Превышена максимальная глубина рекурсии' };
      }

      if (input === '' && stack.length === 0) {
        const successPath = [...path, {
          state,
          input: '',
          stack: [],
          depth,
          transition: null,
          status: 'success',
          message: `Строка принята! Входная строка полностью обработана и стек пуст.`
        }];
        return { accepted: true, path: successPath };
      }

      if (input === '') {
        const stackTop = stack.length > 0 ? stack[0] : null;
        const lambdaTransitions = this.findTransitions(state, 'λ', stackTop);
        
        if (lambdaTransitions.length > 0) {
          for (const trans of lambdaTransitions) {
            const newStack = [...stack];
            newStack.shift();
            
            if (trans.stackPush !== 'λ') {
              const pushSymbols = trans.stackPush.split('');
              newStack.unshift(...pushSymbols);
            }

            const newPath = [...path, {
              state,
              input,
              stack: [...stack],
              depth,
              transition: trans,
              status: 'exploring',
              message: `Применяем переход: (${trans.fromState}, ${trans.inputSymbol}, ${trans.stackTop}) → (${trans.toState}, ${trans.stackPush})`
            }];

            const result = explore(trans.toState, input, newStack, newPath, depth + 1);
            if (result.accepted) {
              return result;
            }
            
            allPaths.push({
              path: result.path || newPath,
              reason: result.reason || 'Ветвь не привела к успеху'
            });
          }
        }
        
        const failPath = [...path, {
          state,
          input,
          stack: [...stack],
          depth,
          transition: null,
          status: 'failed',
          message: `Входная строка закончилась в состоянии ${state} со стеком [${stack.join(', ')}]. Нет подходящих λ-переходов.`
        }];
        allPaths.push({
          path: failPath,
          reason: `Входная строка обработана, но не достигнуто конечное состояние. Текущее состояние: ${state}, стек: [${stack.join(', ')}]`
        });
        return { 
          accepted: false, 
          reason: `Строка обработана не полностью. Состояние: ${state}, стек: [${stack.join(', ')}]`,
          path: failPath
        };
      }

      const currentSymbol = input[0];
      const stackTop = stack.length > 0 ? stack[0] : null;

      if (!stackTop) {
        const failPath = [...path, {
          state,
          input,
          stack: [...stack],
          depth,
          transition: null,
          status: 'failed',
          message: 'Стек пуст, невозможно продолжить обработку.'
        }];
        allPaths.push({
          path: failPath,
          reason: 'Стек опустел, невозможно продолжить'
        });
        return { accepted: false, reason: 'Стек опустел', path: failPath };
      }

      const possibleTransitions = this.findTransitions(state, currentSymbol, stackTop);
      const allTransitions = possibleTransitions;

      if (allTransitions.length === 0) {
        const failPath = [...path, {
          state,
          input,
          stack: [...stack],
          depth,
          transition: null,
          status: 'failed',
          message: `Нет подходящего перехода для (${state}, ${currentSymbol}, ${stackTop})`
        }];
        allPaths.push({
          path: failPath,
          reason: `Не найден переход для состояния ${state}, символа '${currentSymbol}' и вершины стека '${stackTop}'`
        });
        return { 
          accepted: false, 
          reason: `Нет перехода для (${state}, ${currentSymbol}, ${stackTop})`,
          path: failPath
        };
      }

      for (const transition of allTransitions) {
        const newStack = [...stack];
        newStack.shift();
        
        if (transition.stackPush !== 'λ') {
          const pushSymbols = transition.stackPush.split('');
          newStack.unshift(...pushSymbols);
        }

        const newInput = transition.inputSymbol === 'λ' ? input : input.slice(1);
        
        const newPath = [...path, {
          state,
          input,
          stack: [...stack],
          depth,
          transition,
          status: 'exploring',
          message: `Применяем переход: (${transition.fromState}, ${transition.inputSymbol}, ${transition.stackTop}) → (${transition.toState}, ${transition.stackPush})`
        }];

        const result = explore(transition.toState, newInput, newStack, newPath, depth + 1);
        
        if (result.accepted) {
          return result;
        }
        
        allPaths.push({
          path: result.path || newPath,
          reason: result.reason || 'Ветвь не привела к успеху'
        });
      }

      return { 
        accepted: false, 
        reason: 'Все возможные ветви исследованы, ни одна не привела к успеху',
        path: path
      };
    };

    const initialPath = [{
      state: initialState,
      input: inputString,
      stack: [...initialStack],
      depth: 0,
      transition: null,
      status: 'exploring',
      message: `Начальная конфигурация: состояние ${initialState}, строка "${inputString}", стек [${initialStack.join(', ')}]`
    }];

    const result = explore(initialState, inputString, initialStack, initialPath);
    
    const uniquePaths = this.deduplicatePaths(allPaths);
    
    return {
      accepted: result.accepted,
      path: result.accepted ? result.path : (uniquePaths.length > 0 ? uniquePaths[0].path : initialPath),
      allPaths: result.accepted ? [] : uniquePaths,
      reason: result.reason
    };
  }
}
