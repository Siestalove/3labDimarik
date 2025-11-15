export default function ExecutionVisualization({ result }) {
  if (!result) return null;

  const { accepted, path, allPaths, reason } = result;

  const renderStep = (step, index) => {
    const { state, input, stack, transition, status, message } = step;
    
    let stepClass = 'step ';
    if (status === 'success') {
      stepClass += 'step-success';
    } else if (status === 'failed') {
      stepClass += 'step-failed';
    } else {
      stepClass += 'step-explored';
    }

    return (
      <div key={index} className={stepClass}>
        <div className="step-header">
          <span className="step-number">Шаг {index + 1}</span>
          {transition && (
            <span>
              ({transition.fromState}, {transition.inputSymbol}, {transition.stackTop}) 
              → ({transition.toState}, {transition.stackPush})
            </span>
          )}
        </div>
        
        <div className="step-state">
          <span>Состояние: <span className="state-badge">{state}</span></span>
          <span>Осталось: <code>{input || 'ε'}</code></span>
          <span className="stack-display">Стек: [{stack.join(', ')}]</span>
        </div>
        
        {message && <div style={{ marginTop: '8px', fontSize: '13px' }}>{message}</div>}
      </div>
    );
  };

  return (
    <div className={`result-container ${accepted ? 'result-accepted' : 'result-rejected'}`}>
      <div className="result-title">
        {accepted ? '✓ Строка ПРИНЯТА' : '✗ Строка ОТКЛОНЕНА'}
      </div>
      
      {!accepted && reason && (
        <div className="result-message">
          <strong>Причина:</strong> {reason}
        </div>
      )}

      {path && path.length > 0 && (
        <div className="execution-path">
          <div className="execution-path-title">
            {accepted ? 'Успешный путь выполнения:' : 'Основной путь выполнения:'}
          </div>
          {path.map((step, index) => renderStep(step, index))}
        </div>
      )}

      {!accepted && allPaths && allPaths.length > 1 && (
        <div className="execution-path" style={{ marginTop: '30px' }}>
          <div className="execution-path-title">
            Исследовано альтернативных путей: {allPaths.length}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            Автомат пытался найти правильный путь, но все варианты привели к неудаче.
            Показан наиболее продвинутый путь выше.
          </div>
          {allPaths.slice(1, 4).map((pathInfo, pathIndex) => (
            <details key={pathIndex} style={{ marginBottom: '15px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                Альтернативный путь #{pathIndex + 2} - {pathInfo.reason}
              </summary>
              <div style={{ marginTop: '10px', paddingLeft: '15px' }}>
                {pathInfo.path.map((step, stepIndex) => renderStep(step, stepIndex))}
              </div>
            </details>
          ))}
          {allPaths.length > 4 && (
            <div style={{ fontSize: '13px', color: '#888', fontStyle: 'italic', marginTop: '10px' }}>
              ...и ещё {allPaths.length - 4} путей были исследованы
            </div>
          )}
        </div>
      )}
    </div>
  );
}
