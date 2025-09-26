import { useCallback, useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';
import { defaultWorkspaceState, registerBlocks, stageDimensions, theme, toolboxDefinition } from './blocklySetup';

interface SpriteState {
  x: number;
  y: number;
  direction: number;
  speech: string | null;
  trail: Array<{ x: number; y: number }>;
}

const initialSpriteState: SpriteState = {
  x: 0,
  y: 0,
  direction: 90,
  speech: null,
  trail: [{ x: 0, y: 0 }]
};

const freshSpriteState = (): SpriteState => ({
  ...initialSpriteState,
  trail: [...initialSpriteState.trail]
});

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

class StageRuntime {
  private state: SpriteState = freshSpriteState();
  private readonly halfWidth = stageDimensions.width / 2;
  private readonly halfHeight = stageDimensions.height / 2;
  private readonly stepScale = 10;
  private logs: string[] = [];

  snapshot(): SpriteState {
    return {
      ...this.state,
      trail: [...this.state.trail]
    };
  }

  private commitPosition(x: number, y: number) {
    const clampedX = clamp(x, -this.halfWidth, this.halfWidth);
    const clampedY = clamp(y, -this.halfHeight, this.halfHeight);
    this.state = {
      ...this.state,
      x: clampedX,
      y: clampedY,
      trail: [...this.state.trail, { x: clampedX, y: clampedY }]
    };
  }

  async move(steps: number) {
    const distance = steps * this.stepScale;
    const radians = ((this.state.direction - 90) * Math.PI) / 180;
    const nextX = this.state.x + Math.cos(radians) * distance;
    const nextY = this.state.y + Math.sin(radians) * distance;
    this.commitPosition(nextX, nextY);
    this.logs.push(`Move ${steps} steps`);
  }

  async turn(degrees: number) {
    let nextDirection = (this.state.direction + degrees) % 360;
    if (nextDirection < 0) {
      nextDirection += 360;
    }
    this.state = {
      ...this.state,
      direction: nextDirection
    };
    this.logs.push(`Turn ${degrees > 0 ? 'right' : 'left'} ${Math.abs(degrees)}°`);
  }

  async say(message: string) {
    this.state = {
      ...this.state,
      speech: message
    };
    this.logs.push(`Say: ${message}`);
  }

  async wait(seconds: number) {
    const duration = Math.max(seconds, 0);
    this.logs.push(`Wait ${duration.toFixed(1)} second(s)`);
    if (duration === 0) {
      return;
    }

    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), duration * 250);
    });
  }

  getReport() {
    const { x, y, direction } = this.state;
    return `x: ${x.toFixed(1)}, y: ${y.toFixed(1)}, direction: ${direction.toFixed(0)}°`;
  }

  getLogs() {
    return this.logs.join('\n');
  }
}

const StageView = ({ sprite }: { sprite: SpriteState }) => {
  const left = stageDimensions.width / 2 + sprite.x - 32;
  const top = stageDimensions.height / 2 - sprite.y - 32;
  const path = sprite.trail
    .map(({ x, y }) => `${stageDimensions.width / 2 + x},${stageDimensions.height / 2 - y}`)
    .join(' ');
  const points = path || `${stageDimensions.width / 2 + sprite.x},${stageDimensions.height / 2 - sprite.y}`;

  return (
    <div className="stage-card">
      <h2>Stage</h2>
      <div className="stage-canvas">
        <div className="stage-trail">
          <svg viewBox={`0 0 ${stageDimensions.width} ${stageDimensions.height}`}>
            <polyline
              points={points}
              fill="none"
              stroke="#6a65ff"
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {sprite.speech ? <div className="stage-speech">{sprite.speech}</div> : null}
        <div
          className="stage-character"
          style={{ transform: `translate(${left}px, ${top}px) rotate(${-sprite.direction}deg)` }}
        >
          ★
        </div>
      </div>
      <div className="stage-info">
        <strong>Sprite</strong>
        <span>{`Position: (${sprite.x.toFixed(1)}, ${sprite.y.toFixed(1)})`}</span>
        <span>{`Direction: ${sprite.direction.toFixed(0)}°`}</span>
      </div>
    </div>
  );
};

const App = () => {
  const blocklyRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const [code, setCode] = useState('');
  const [sprite, setSprite] = useState<SpriteState>(() => freshSpriteState());
  const [logs, setLogs] = useState('Ready to run your program.');
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    registerBlocks();
  }, []);

  const updateCode = useCallback(() => {
    const workspace = workspaceRef.current;
    if (!workspace) {
      return;
    }
    const generatedCode = javascriptGenerator.workspaceToCode(workspace);
    setCode(generatedCode.trim());
  }, []);

  useEffect(() => {
    if (!blocklyRef.current) {
      return;
    }

    const workspace = Blockly.inject(blocklyRef.current, {
      toolbox: toolboxDefinition,
      theme,
      renderer: 'thrasos',
      move: {
        wheel: true,
        drag: true,
        scrollbars: true
      },
      grid: {
        spacing: 24,
        length: 3,
        colour: '#dde3ff',
        snap: true
      },
      trashcan: true
    });

    workspaceRef.current = workspace;
    Blockly.serialization.workspaces.load(defaultWorkspaceState, workspace);
    updateCode();
    const listener = () => updateCode();
    workspace.addChangeListener(listener);

    return () => {
      workspace.removeChangeListener(listener);
      workspace.dispose();
      workspaceRef.current = null;
    };
  }, [updateCode]);

  const resetWorkspace = useCallback(() => {
    const workspace = workspaceRef.current;
    if (!workspace) {
      return;
    }
    Blockly.serialization.workspaces.load(defaultWorkspaceState, workspace);
    updateCode();
    setSprite(freshSpriteState());
    setLogs('Workspace reset to starter project.');
  }, [updateCode]);

  const runProgram = useCallback(async () => {
    const workspace = workspaceRef.current;
    if (!workspace) {
      return;
    }

    const generatedCode = javascriptGenerator.workspaceToCode(workspace);
    setCode(generatedCode.trim());

    const runtime = new StageRuntime();
    setIsRunning(true);
    setLogs('Running...');

    try {
      const runner = new Function(
        'runtime',
        `return (async () => {\n${generatedCode}\n});`
      );

      await runner(runtime)();
      setSprite(runtime.snapshot());
      const report = runtime.getReport();
      const history = runtime.getLogs();
      setLogs(history ? `${history}\n${report}` : report);
    } catch (error) {
      setLogs(`Error: ${(error as Error).message}`);
    } finally {
      setIsRunning(false);
    }
  }, []);

  return (
    <div className="app-shell">
      <header>
        <h1>MyBlock Studio</h1>
        <p>
          Build interactive animations and stories with friendly blocks inspired by Scratch, OpenBlock,
          and mBlock. Drag, drop, and run your code instantly on the stage.
        </p>
      </header>

      <aside className="sidebar">
        <section>
          <h2>Project actions</h2>
          <button onClick={runProgram} disabled={isRunning}>
            {isRunning ? 'Running…' : 'Run Program'}
          </button>
          <button className="secondary" onClick={resetWorkspace} disabled={isRunning}>
            Reset to Starter
          </button>
        </section>
        <section>
          <h2>Learning</h2>
          <p>
            Try stacking motion blocks under the event hat to move the star, or add a repeat block for
            loops.
          </p>
        </section>
      </aside>

      <main className="main">
        <section className="workspace-card">
          <h2>Blocks Workspace</h2>
          <div ref={blocklyRef} className="workspace-container" />
        </section>

        <StageView sprite={sprite} />

        <section className="code-card">
          <h2>Generated JavaScript</h2>
          <pre>{code || '// Start building with blocks to generate code.'}</pre>
          <div className="controls">
            <button onClick={runProgram} disabled={isRunning}>
              {isRunning ? 'Running…' : 'Run Again'}
            </button>
            <button className="secondary" onClick={resetWorkspace} disabled={isRunning}>
              Reset Stage
            </button>
          </div>
          <h3>Output</h3>
          <pre>{logs}</pre>
        </section>
      </main>
    </div>
  );
};

export default App;
