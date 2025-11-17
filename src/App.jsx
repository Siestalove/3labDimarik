import { useState } from 'react';
import './App.css';
import TransitionTable from './components/TransitionTable';
import ExecutionVisualization from './components/ExecutionVisualization';
import { PDASimulator } from './pdaSimulator';

const exampleTransitions = [
  { id: 1, fromState: 'q0', inputSymbol: 'a', stackTop: 'Z', toState: 'q0', stackPush: 'aZ' },
  { id: 2, fromState: 'q0', inputSymbol: 'b', stackTop: 'Z', toState: 'q0', stackPush: 'bZ' },
  { id: 3, fromState: 'q0', inputSymbol: 'a', stackTop: 'a', toState: 'q0', stackPush: 'aa' },
  { id: 4, fromState: 'q0', inputSymbol: 'a', stackTop: 'a', toState: 'q1', stackPush: 'λ' },
  { id: 5, fromState: 'q0', inputSymbol: 'a', stackTop: 'b', toState: 'q0', stackPush: 'ab' },
  { id: 6, fromState: 'q0', inputSymbol: 'b', stackTop: 'a', toState: 'q0', stackPush: 'ba' },
  { id: 7, fromState: 'q0', inputSymbol: 'b', stackTop: 'b', toState: 'q0', stackPush: 'bb' },
  { id: 8, fromState: 'q0', inputSymbol: 'b', stackTop: 'b', toState: 'q1', stackPush: 'λ' },
  { id: 9, fromState: 'q1', inputSymbol: 'a', stackTop: 'a', toState: 'q1', stackPush: 'λ' },
  { id: 10, fromState: 'q1', inputSymbol: 'b', stackTop: 'b', toState: 'q1', stackPush: 'λ' },
  { id: 11, fromState: 'q1', inputSymbol: 'λ', stackTop: 'Z', toState: 'q2', stackPush: 'λ' }
];

function App() {
  const [transitions, setTransitions] = useState([
    { id: Date.now(), fromState: '', inputSymbol: '', stackTop: '', toState: '', stackPush: '' }
  ]);
  const [inputString, setInputString] = useState('');
  const [result, setResult] = useState(null);

  const runSimulation = () => {
    if (!inputString) {
      alert('Пожалуйста, введите строку для проверки');
      return;
    }

    const validTransitions = transitions.filter(t => 
      t.fromState && t.inputSymbol !== '' && t.stackTop && t.toState && t.stackPush !== ''
    );

    if (validTransitions.length === 0) {
      alert('Пожалуйста, добавьте хотя бы один корректный переход');
      return;
    }

    const simulator = new PDASimulator(validTransitions);
    const simulationResult = simulator.simulate(inputString);
    setResult(simulationResult);
  };

  const clearAll = () => {
    setTransitions([
      { id: Date.now(), fromState: '', inputSymbol: '', stackTop: '', toState: '', stackPush: '' }
    ]);
    setInputString('');
    setResult(null);
  };

  const loadExample = () => {
    setTransitions(exampleTransitions);
    setInputString('aabbaa');
    setResult(null);
  };

  return (
    <div className="app">
      <h1 className="app-title">ДМП-Автомат Визуализатор</h1>
      <p className="app-subtitle">
        Детерминированный Магазинный Автомат с поддержкой недетерминизма
      </p>

      <div className="section">
        <h2 className="section-title">Таблица переходов</h2>
        <TransitionTable 
          transitions={transitions} 
          setTransitions={setTransitions}
        />
      </div>

      <div className="section">
        <h2 className="section-title">Входная строка</h2>
        <div className="input-string-container">
          <input
            type="text"
            className="input-string-field"
            value={inputString}
            onChange={(e) => setInputString(e.target.value)}
            placeholder="Введите строку для проверки (например: aabbaa)"
          />
          <button className="run-btn" onClick={runSimulation}>
            ▶ Запустить
          </button>
          <button className="clear-btn" onClick={clearAll}>
            Очистить всё
          </button>
        </div>
      </div>

      {result && (
        <div className="section">
          <h2 className="section-title">Результат выполнения</h2>
          <ExecutionVisualization result={result} />
        </div>
      )}

      <div className="example-section">
        <div className="example-title">Пример из задания</div>
        <div className="example-content">
          <div>Язык палиндромов: строки вида w·w^R, где w^R - обращение w</div>
          <div style={{ marginTop: '10px' }}>
            Переходы:<br/>
            1) (q0, a, Z) → (q0, aZ)<br/>
            2) (q0, b, Z) → (q0, bZ)<br/>
            3) (q0, a, a) → (q0, aa) или (q1, λ)<br/>
            4) (q0, a, b) → (q0, ab)<br/>
            5) (q0, b, a) → (q0, ba)<br/>
            6) (q0, b, b) → (q0, bb) или (q1, λ)<br/>
            7) (q1, a, a) → (q1, λ)<br/>
            8) (q1, b, b) → (q1, λ)<br/>
            9) (q1, λ, Z) → (q2, λ)
          </div>
          <div style={{ marginTop: '10px' }}>
            Примеры: &quot;aabbaa&quot; (принимается), &quot;abba&quot; (принимается), &quot;abc&quot; (отклоняется)
          </div>
        </div>
        <button className="load-example-btn" onClick={loadExample}>
          Загрузить пример
        </button>
      </div>
    </div>
  );
}

export default App;
