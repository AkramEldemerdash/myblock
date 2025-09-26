import { useCallback, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

interface SpriteState {
  x: number;
  y: number;
  direction: number;
  speech: string | null;
  trail: Array<{ x: number; y: number }>;
}

const stageDimensions = {
  width: 320,
  height: 320
};

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
    await new Promise<void>((resolve) => setTimeout(resolve, duration * 250));
  }

  getReport() {
    const { x, y, direction } = this.state;
    return `x: ${x.toFixed(1)}, y: ${y.toFixed(1)}, direction: ${direction.toFixed(0)}°`;
  }

  getLogs() {
    return this.logs.join('\n');
  }
}

const defaultCode = `await runtime.move(10);\nawait runtime.turn(90);\nawait runtime.say("Hello, MyBlock!");`;

const samplePrograms = [
  {
    title: 'Star Greeting',
    description: 'Moves forward, turns, and says hello — matches the starter web project.',
    code: defaultCode
  },
  {
    title: 'Square Walk',
    description: 'Draws a simple square path using a repeat loop.',
    code: `for (let i = 0; i < 4; i++) {\n  await runtime.move(12);\n  await runtime.turn(90);\n}\nawait runtime.say('I made a square!');`
  }
];

const StageView = ({ sprite }: { sprite: SpriteState }) => {
  const centerX = stageDimensions.width / 2;
  const centerY = stageDimensions.height / 2;
  const path = sprite.trail
    .map(({ x, y }) => `${centerX + x},${centerY - y}`)
    .join(' ');
  const points = path || `${centerX + sprite.x},${centerY - sprite.y}`;

  return (
    <View style={styles.stageContainer}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${stageDimensions.width} ${stageDimensions.height}`}>
        <Polyline
          points={points}
          fill="none"
          stroke="#6a65ff"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle
          cx={centerX + sprite.x}
          cy={centerY - sprite.y}
          r={22}
          fill="#6a65ff"
          stroke="#ffffff"
          strokeWidth={4}
        />
      </Svg>
      {sprite.speech ? (
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>{sprite.speech}</Text>
        </View>
      ) : null}
    </View>
  );
};

export default function App() {
  const [code, setCode] = useState(defaultCode);
  const [sprite, setSprite] = useState<SpriteState>(() => freshSpriteState());
  const [logs, setLogs] = useState('Tap run to execute your program.');
  const [running, setRunning] = useState(false);

  const runProgram = useCallback(async () => {
    const runtime = new StageRuntime();
    setRunning(true);
    setLogs('Running...');

    try {
      const runner = new Function('runtime', `return (async () => {\n${code}\n});`);
      await runner(runtime)();
      setSprite(runtime.snapshot());
      const history = runtime.getLogs();
      const report = runtime.getReport();
      setLogs(history ? `${history}\n${report}` : report);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLogs(`Error: ${message}`);
    } finally {
      setRunning(false);
    }
  }, [code]);

  const resetProgram = useCallback(() => {
    setCode(defaultCode);
    setSprite(freshSpriteState());
    setLogs('Starter program restored.');
  }, []);

  const loadSample = useCallback((sampleCode: string, title: string) => {
    setCode(sampleCode);
    setLogs(`Loaded sample: ${title}`);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>MyBlock Studio Mobile</Text>
        <Text style={styles.subtitle}>
          Paste JavaScript exported from the web editor or try a curated sample. Run it to see the star
          perform the actions.
        </Text>

        <StageView sprite={sprite} />

        <Text style={styles.sectionTitle}>Program Code</Text>
        <TextInput
          multiline
          style={styles.editor}
          value={code}
          onChangeText={setCode}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Paste generated code here"
        />

        <View style={styles.buttonRow}>
          <Pressable
            onPress={runProgram}
            style={[styles.button, styles.primaryButton, running && styles.buttonDisabled]}
            disabled={running}
          >
            <Text style={styles.buttonLabel}>{running ? 'Running…' : 'Run Program'}</Text>
          </Pressable>
          <Pressable
            onPress={resetProgram}
            style={[styles.button, styles.secondaryButton]}
            disabled={running}
          >
            <Text style={[styles.buttonLabel, styles.secondaryButtonLabel]}>Reset</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Sample Programs</Text>
        {samplePrograms.map((sample) => (
          <Pressable
            key={sample.title}
            style={styles.sampleCard}
            onPress={() => loadSample(sample.code, sample.title)}
            disabled={running}
          >
            <Text style={styles.sampleTitle}>{sample.title}</Text>
            <Text style={styles.sampleDescription}>{sample.description}</Text>
          </Pressable>
        ))}

        <Text style={styles.sectionTitle}>Output</Text>
        <View style={styles.outputBox}>
          <Text style={styles.outputText}>{logs}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f7fb'
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 24
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2430'
  },
  subtitle: {
    fontSize: 16,
    color: '#5a6283',
    marginTop: 8
  },
  stageContainer: {
    width: '100%',
    height: 320,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24
  },
  speechBubble: {
    position: 'absolute',
    top: 18,
    left: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d3dcff'
  },
  speechText: {
    color: '#444b9a',
    fontWeight: '600'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2430',
    marginTop: 24,
    marginBottom: 8
  },
  editor: {
    minHeight: 140,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#1f2430',
    borderWidth: 1,
    borderColor: '#e3e8f5'
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 8
  },
  button: {
    flex: 1,
    backgroundColor: '#6a65ff',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center'
  },
  primaryButton: {
    marginRight: 12
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonLabel: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16
  },
  secondaryButton: {
    backgroundColor: '#eef1ff'
  },
  secondaryButtonLabel: {
    color: '#4b5394'
  },
  sampleCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e3e8f5',
    marginBottom: 12
  },
  sampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2430'
  },
  sampleDescription: {
    fontSize: 14,
    color: '#5a6283',
    marginTop: 4
  },
  outputBox: {
    backgroundColor: '#101427',
    borderRadius: 18,
    padding: 16,
    marginBottom: 32
  },
  outputText: {
    color: '#e3e8ff',
    fontFamily: 'monospace'
  }
});
