import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import { javascriptGenerator } from 'blockly/javascript';

let isRegistered = false;

export const stageDimensions = {
  width: 320,
  height: 320
};

export const toolboxDefinition: Blockly.utils.toolbox.ToolboxDefinition = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Events',
      colour: '#FFD500',
      contents: [{ kind: 'block', type: 'event_when_run' }]
    },
    {
      kind: 'category',
      name: 'Motion',
      colour: '#4C97FF',
      contents: [
        { kind: 'block', type: 'motion_move_steps' },
        { kind: 'block', type: 'motion_turn_right' },
        { kind: 'block', type: 'motion_turn_left' }
      ]
    },
    {
      kind: 'category',
      name: 'Looks',
      colour: '#9966FF',
      contents: [
        { kind: 'block', type: 'looks_say_message' }
      ]
    },
    {
      kind: 'category',
      name: 'Control',
      colour: '#FFAB19',
      contents: [
        { kind: 'block', type: 'control_wait_seconds' },
        { kind: 'block', type: 'control_repeat_times' }
      ]
    }
  ]
};

export const defaultWorkspaceState = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: 'event_when_run',
        id: 'start',
        x: 40,
        y: 40,
        fields: {},
        inputs: {
          DO: {
            block: {
              type: 'motion_move_steps',
              id: 'move',
              fields: {
                STEPS: 10
              },
              next: {
                block: {
                  type: 'motion_turn_right',
                  id: 'turn',
                  fields: {
                    DEGREES: 90
                  },
                  next: {
                    block: {
                      type: 'looks_say_message',
                      id: 'say',
                      fields: {
                        MESSAGE: 'Hello, MyBlock!'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]
  }
};

type BlockDefinition = Parameters<typeof Blockly.defineBlocksWithJsonArray>[0];

export const registerBlocks = () => {
  if (isRegistered) {
    return;
  }

  const blocks: BlockDefinition = [
    {
      type: 'event_when_run',
      message0: 'when play clicked',
      nextStatement: null,
      colour: 50,
      hat: 'cap',
      tooltip: 'Start the program when the play button is clicked.'
    },
    {
      type: 'motion_move_steps',
      message0: 'move %1 steps',
      args0: [
        {
          type: 'field_number',
          name: 'STEPS',
          value: 10,
          min: -100,
          max: 100
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 210,
      tooltip: 'Move the sprite forward or backward by the given number of steps.'
    },
    {
      type: 'motion_turn_right',
      message0: 'turn right %1 degrees',
      args0: [
        {
          type: 'field_angle',
          name: 'DEGREES',
          angle: 90
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 210,
      tooltip: 'Rotate the sprite clockwise.'
    },
    {
      type: 'motion_turn_left',
      message0: 'turn left %1 degrees',
      args0: [
        {
          type: 'field_angle',
          name: 'DEGREES',
          angle: 90
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 210,
      tooltip: 'Rotate the sprite counter-clockwise.'
    },
    {
      type: 'looks_say_message',
      message0: 'say %1',
      args0: [
        {
          type: 'field_input',
          name: 'MESSAGE',
          text: 'Hello!'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 290,
      tooltip: 'Display a speech bubble with the given text.'
    },
    {
      type: 'control_wait_seconds',
      message0: 'wait %1 seconds',
      args0: [
        {
          type: 'field_number',
          name: 'SECONDS',
          value: 1,
          min: 0,
          precision: 0.1
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 30,
      tooltip: 'Pause the program for the given number of seconds.'
    },
    {
      type: 'control_repeat_times',
      message0: 'repeat %1 times %2 %3',
      args0: [
        {
          type: 'field_number',
          name: 'TIMES',
          value: 4,
          min: 0
        },
        {
          type: 'input_dummy'
        },
        {
          type: 'input_statement',
          name: 'DO'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 30,
      tooltip: 'Repeat the contained blocks a number of times.'
    }
  ];

  Blockly.defineBlocksWithJsonArray(blocks);

  javascriptGenerator.forBlock['event_when_run'] = (block: Blockly.Block) => {
    const statements = javascriptGenerator.statementToCode(block, 'DO');
    return `${statements}`;
  };

  javascriptGenerator.forBlock['motion_move_steps'] = (block: Blockly.Block) => {
    const steps = Number(block.getFieldValue('STEPS')) || 0;
    return `await runtime.move(${steps});\n`;
  };

  javascriptGenerator.forBlock['motion_turn_right'] = (block: Blockly.Block) => {
    const degrees = Number(block.getFieldValue('DEGREES')) || 0;
    return `await runtime.turn(${degrees});\n`;
  };

  javascriptGenerator.forBlock['motion_turn_left'] = (block: Blockly.Block) => {
    const degrees = Number(block.getFieldValue('DEGREES')) || 0;
    return `await runtime.turn(${-degrees});\n`;
  };

  javascriptGenerator.forBlock['looks_say_message'] = (block: Blockly.Block) => {
    const message = javascriptGenerator.quote_(block.getFieldValue('MESSAGE'));
    return `await runtime.say(${message});\n`;
  };

  javascriptGenerator.forBlock['control_wait_seconds'] = (block: Blockly.Block) => {
    const seconds = Number(block.getFieldValue('SECONDS')) || 0;
    return `await runtime.wait(${seconds});\n`;
  };

  javascriptGenerator.forBlock['control_repeat_times'] = (block: Blockly.Block) => {
    const times = Number(block.getFieldValue('TIMES')) || 0;
    const branch = javascriptGenerator.statementToCode(block, 'DO');
    return `for (let count = 0; count < ${times}; count++) {\n${branch}}\n`;
  };

  isRegistered = true;
};

export const theme = Blockly.Theme.defineTheme('myblockTheme', {
  name: 'myblockTheme',
  base: Blockly.Themes.Classic,
  blockStyles: {
    event_blocks: {
      colourPrimary: '#FFD500',
      colourSecondary: '#FFE666',
      colourTertiary: '#CCAA00'
    },
    motion_blocks: {
      colourPrimary: '#4C97FF',
      colourSecondary: '#66B3FF',
      colourTertiary: '#4178D9'
    },
    looks_blocks: {
      colourPrimary: '#9966FF',
      colourSecondary: '#B388FF',
      colourTertiary: '#7A4FCC'
    },
    control_blocks: {
      colourPrimary: '#FFAB19',
      colourSecondary: '#FFBD42',
      colourTertiary: '#E08F00'
    }
  },
  categoryStyles: {
    events_category: {
      colour: '#FFD500'
    },
    motion_category: {
      colour: '#4C97FF'
    },
    looks_category: {
      colour: '#9966FF'
    },
    control_category: {
      colour: '#FFAB19'
    }
  },
  componentStyles: {
    workspaceBackgroundColour: '#f5f7ff',
    toolboxBackgroundColour: '#ffffff',
    toolboxForegroundColour: '#1f2430',
    flyoutBackgroundColour: '#ffffff',
    flyoutForegroundColour: '#1f2430',
    flyoutOpacity: 1,
    scrollbarColour: '#B6C4FF',
    scrollbarOpacity: 0.8,
    insertionMarkerColour: '#6A65FF',
    insertionMarkerOpacity: 0.4,
    cursorColour: '#6A65FF',
    selectedGlowColour: '#6A65FF',
    selectedGlowSize: 2
  },
  fontStyle: {
    family: '"Inter", system-ui, sans-serif',
    size: 14
  }
});
