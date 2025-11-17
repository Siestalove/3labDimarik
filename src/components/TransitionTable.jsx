export default function TransitionTable({ transitions, setTransitions }) {
  const addTransition = () => {
    setTransitions([...transitions, {
      id: Date.now(),
      fromState: '',
      inputSymbol: '',
      stackTop: '',
      toState: '',
      stackPush: ''
    }]);
  };

  const updateTransition = (id, field, value) => {
    setTransitions(transitions.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const deleteTransition = (id) => {
    setTransitions(transitions.filter(t => t.id !== id));
  };

  return (
    <div>
      <table className="transition-table">
        <thead>
          <tr>
            <th>№</th>
            <th>Из состояния</th>
            <th>Входной символ (λ для пустого)</th>
            <th>Вершина стека</th>
            <th>В состояние</th>
            <th>Записать в стек (λ для пустого)</th>
            <th>Действие</th>
          </tr>
        </thead>
        <tbody>
          {transitions.map((transition, index) => (
            <tr key={transition.id}>
              <td>{index + 1}</td>
              <td>
                <input
                  type="text"
                  value={transition.fromState}
                  onChange={(e) => updateTransition(transition.id, 'fromState', e.target.value)}
                  placeholder="q0"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={transition.inputSymbol}
                  onChange={(e) => updateTransition(transition.id, 'inputSymbol', e.target.value)}
                  placeholder="a или λ"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={transition.stackTop}
                  onChange={(e) => updateTransition(transition.id, 'stackTop', e.target.value)}
                  placeholder="Z"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={transition.toState}
                  onChange={(e) => updateTransition(transition.id, 'toState', e.target.value)}
                  placeholder="q1"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={transition.stackPush}
                  onChange={(e) => updateTransition(transition.id, 'stackPush', e.target.value)}
                  placeholder="aZ или λ"
                />
              </td>
              <td>
                <button 
                  className="delete-btn"
                  onClick={() => deleteTransition(transition.id)}
                >
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="add-transition-btn" onClick={addTransition}>
        + Добавить переход
      </button>
    </div>
  );
}
