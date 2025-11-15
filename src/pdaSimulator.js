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

  simulate(inputString) {
    const initialStack = ['Z'];
    const initialState = 'q0';
    
    const results = [];
    
    const explore = (state, input, stack, path, depth = 0) => {
      if (depth > 1000) {
        return { accepted: false, reason: 'Превышена максимальная глубина рекурсии (возможно зацикливание)' };
      }

      const currentConfig = {
        state,
        input,
        stack: [...stack],
        depth
      };

      if (input === '' && stack.length === 1 && stack[0] === 'Z' && state === 'q0') {
        const successPath = [...path, {
          ...currentConfig,
          transition: null,
          status: 'success',
          message: 'Строка принята! Стек содержит только Z, входная строка обработана полностью.'
        }];
        return { accepted: true, path: successPath };
      }

      if (input === '' && stack.length > 0 && stack[0] === 'Z') {
        const lambdaTransitions = this.findTransitions(state, 'λ', 'Z');
        
        for (const trans of lambdaTransitions) {
          const newStack = [...stack];
          newStack.shift();
          
          if (trans.stackPush !== 'λ') {
            const pushSymbols = trans.stackPush.split('').reverse();
            newStack.unshift(...pushSymbols);
          }

          const newPath = [...path, {
            ...currentConfig,
            transition: trans,
            status: 'exploring',
            message: `Применяем переход: (${trans.fromState}, ${trans.inputSymbol}, ${trans.stackTop}) → (${trans.toState}, ${trans.stackPush})`
          }];

          if (trans.toState === 'q2' && trans.stackPush === 'λ' && newStack.length === 0) {
            const successPath = [...newPath, {
              state: trans.toState,
              input: '',
              stack: [],
              depth: depth + 1,
              transition: null,
              status: 'success',
              message: 'Строка принята! Достигнуто конечное состояние q2.'
            }];
            return { accepted: true, path: successPath };
          }

          const result = explore(trans.toState, input, newStack, newPath, depth + 1);
          if (result.accepted) {
            return result;
          }
          
          results.push({
            path: newPath,
            reason: result.reason || 'Ветвь не привела к успеху'
          });
        }
      }

      if (input === '') {
        const failPath = [...path, {
          ...currentConfig,
          transition: null,
          status: 'failed',
          message: `Входная строка закончилась, но автомат в состоянии ${state} со стеком [${stack.join(', ')}]. Нет подходящих λ-переходов.`
        }];
        results.push({
          path: failPath,
          reason: `Входная строка обработана, но не достигнуто конечное состояние. Текущее состояние: ${state}, стек: [${stack.join(', ')}]`
        });
        return { accepted: false, reason: `Строка обработана не полностью. Состояние: ${state}, стек: [${stack.join(', ')}]` };
      }

      const currentSymbol = input[0];
      const stackTop = stack.length > 0 ? stack[0] : null;

      if (!stackTop) {
        const failPath = [...path, {
          ...currentConfig,
          transition: null,
          status: 'failed',
          message: 'Стек пуст, невозможно продолжить обработку.'
        }];
        results.push({
          path: failPath,
          reason: 'Стек опустел, невозможно продолжить'
        });
        return { accepted: false, reason: 'Стек опустел' };
      }

      const possibleTransitions = this.findTransitions(state, currentSymbol, stackTop);
      const lambdaTransitions = this.findTransitions(state, 'λ', stackTop);
      const allTransitions = [...possibleTransitions, ...lambdaTransitions];

      if (allTransitions.length === 0) {
        const failPath = [...path, {
          ...currentConfig,
          transition: null,
          status: 'failed',
          message: `Нет подходящего перехода для (${state}, ${currentSymbol}, ${stackTop})`
        }];
        results.push({
          path: failPath,
          reason: `Не найден переход для состояния ${state}, символа '${currentSymbol}' и вершины стека '${stackTop}'`
        });
        return { 
          accepted: false, 
          reason: `Нет перехода для (${state}, ${currentSymbol}, ${stackTop})` 
        };
      }

      for (const transition of allTransitions) {
        const newStack = [...stack];
        newStack.shift();
        
        if (transition.stackPush !== 'λ') {
          const pushSymbols = transition.stackPush.split('').reverse();
          newStack.unshift(...pushSymbols);
        }

        const newInput = transition.inputSymbol === 'λ' ? input : input.slice(1);
        
        const newPath = [...path, {
          ...currentConfig,
          transition,
          status: 'exploring',
          message: `Применяем переход: (${transition.fromState}, ${transition.inputSymbol}, ${transition.stackTop}) → (${transition.toState}, ${transition.stackPush})`
        }];

        const result = explore(transition.toState, newInput, newStack, newPath, depth + 1);
        
        if (result.accepted) {
          return result;
        }
        
        results.push({
          path: newPath,
          reason: result.reason
        });
      }

      return { 
        accepted: false, 
        reason: 'Все возможные ветви исследованы, ни одна не привела к успеху' 
      };
    };

    const result = explore(initialState, inputString, initialStack, []);
    
    return {
      accepted: result.accepted,
      path: result.path || (results.length > 0 ? results[0].path : []),
      allPaths: results,
      reason: result.reason
    };
  }
}
