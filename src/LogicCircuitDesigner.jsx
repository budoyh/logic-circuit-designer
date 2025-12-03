import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Trash2, RotateCcw, Download, Wand2, X, HelpCircle, Layout, Settings, Image as ImageIcon, AlertTriangle, ArrowRightLeft, MessageSquare, Eye, CheckSquare, Square, Copy, ZoomIn, ZoomOut, Github, Grid, Cpu, Zap, Globe, User, BookOpen, ExternalLink, PlusSquare, Save, Layers } from 'lucide-react';

/**
 * 逻辑电路设计器 v6.4.2
 * 更新日志:
 * 1. 修复左侧工具栏 74LS138 和 74LS153 图标不显示的问题。
 * 2. 74LS138 增加低电平有效 (Active Low) 的视觉标记 (文字上划线)。
 * 3. 优化 AI 提示词生成逻辑：根据当前界面语言生成对应语言的 Prompt。
 * 4. 欢迎弹窗增加作者主页文档引导及联系邮箱。
 */

// --- 多语言配置 ---
const TRANSLATIONS = {
  zh: {
    title: "逻辑电路生成器",
    by: "By",
    viewSource: "查看源码",
    appearance: "外观",
    smartGen: "智能生成",
    newChip: "新建芯片",
    export: "导出",
    clear: "清空",
    reset: "复位",
    input: "输入",
    output: "输出",
    basicGates: "基础逻辑门",
    integratedCircuits: "集成电路 (IC)",
    myChips: "我的芯片 (Custom)",
    powerGround: "电源 / 接地",
    settings: "显示设置",
    simpleNode: "极简节点样式",
    simpleNodeDesc: "开启后，I/O 端口将显示为学术风格的空心圆点。",
    logicExpr: "逻辑表达式",
    aiAssist: "AI 辅助生成",
    allowedGates: "允许使用的逻辑门",
    genCircuit: "生成电路图",
    cancel: "取消",
    close: "关闭",
    copyClose: "复制并关闭",
    saveChip: "保存芯片",
    chipWizardTitle: "自定义芯片向导",
    chipName: "芯片名称 (Label)",
    chipWidth: "芯片宽度",
    leftPins: "左侧引脚 (输入)",
    rightPins: "右侧引脚 (输出)",
    pinsPlaceholder: "使用逗号分隔，例如: A, B, CLK",
    welcomeTitle: "欢迎使用 LogicCircuit Gen",
    author: "作者",
    githubProfile: "GitHub 主页",
    projectRepo: "项目仓库",
    guideTitle: "快速上手指南",
    guideStep1: "1. 智能生成：输入布尔公式自动生成电路。",
    guideStep2: "2. 自定义芯片：点击 '新建芯片' 封装自己的元器件。",
    guideStep3: "3. 交互操作：滚轮缩放，按住空白处拖动平移。",
    guideStep4: "4. 导出分享：支持高清 PNG 导出。",
    moreInfo: "请访问作者主页查看详细使用文档。作者邮箱：budo0422@outlook.com",
    startUsing: "开始使用",
    language: "English",
    nand2: "NAND (2入)",
    nand4: "NAND (4入)",
    xnor: "XNOR (同或)",
    aiPromptTitle: "AI 生成提示词",
    aiPromptDesc: "将以下提示词发送给 ChatGPT/Claude/Gemini，然后将返回的代码粘贴到左侧输入框：",
  },
  en: {
    title: "Logic Circuit Gen",
    by: "By",
    viewSource: "Source Code",
    appearance: "Style",
    smartGen: "Auto Gen",
    newChip: "New Chip",
    export: "Export",
    clear: "Clear",
    reset: "Reset",
    input: "Input",
    output: "Output",
    basicGates: "Basic Gates",
    integratedCircuits: "Integrated Circuits (IC)",
    myChips: "My Chips",
    powerGround: "Power / Ground",
    settings: "Display Settings",
    simpleNode: "Minimalist Style",
    simpleNodeDesc: "Enable academic style hollow circles for I/O ports.",
    logicExpr: "Logic Expression",
    aiAssist: "AI Assistant",
    allowedGates: "Allowed Gates",
    genCircuit: "Generate Circuit",
    cancel: "Cancel",
    close: "Close",
    copyClose: "Copy & Close",
    saveChip: "Save Chip",
    chipWizardTitle: "Custom Chip Wizard",
    chipName: "Chip Name (Label)",
    chipWidth: "Chip Width",
    leftPins: "Left Pins (Inputs)",
    rightPins: "Right Pins (Outputs)",
    pinsPlaceholder: "Comma separated, e.g., A, B, CLK",
    welcomeTitle: "Welcome to LogicCircuit Gen",
    author: "Author",
    githubProfile: "GitHub Profile",
    projectRepo: "Project Repo",
    guideTitle: "Quick Start Guide",
    guideStep1: "1. Auto Gen: Input boolean formulas to generate.",
    guideStep2: "2. Custom Chip: Click 'New Chip' to create your own components.",
    guideStep3: "3. Interaction: Wheel to zoom, drag empty space to pan.",
    guideStep4: "4. Export: One-click HD PNG export.",
    moreInfo: "Visit author's homepage for detailed docs. Email: budo0422@outlook.com",
    startUsing: "Start Designing",
    language: "中文",
    nand2: "NAND (2-In)",
    nand4: "NAND (4-In)",
    xnor: "XNOR",
    aiPromptTitle: "AI Generation Prompt",
    aiPromptDesc: "Send this prompt to ChatGPT/Claude/Gemini, then paste the code result into the input box:",
  }
};

// --- 基础配置 ---
const GRID_SIZE = 20;
const WIRE_COLOR = "#334155";
const WIRE_WIDTH = 2;
const GATE_STROKE_WIDTH = 2;
const LEVEL_WIDTH = 220;
const MIN_NODE_GAP = 120;
const INPUT_ROW_HEIGHT = 90;

// --- 静态资源定义 ---
const SHAPES = {
  AND: <path d="M 10 5 L 10 55 L 35 55 A 25 25 0 0 0 35 5 L 10 5 Z" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} />,
  OR: <path d="M 10 5 C 10 5 22 18 22 30 C 22 42 10 55 10 55 C 40 55 60 42 60 30 C 60 18 40 5 10 5 Z" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} />,
  NOT: <g><path d="M 10 10 L 10 50 L 50 30 Z" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} /><circle cx="56" cy="30" r="4" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} /></g>,
  NAND: <g><path d="M 10 5 L 10 55 L 35 55 A 25 25 0 0 0 35 5 L 10 5 Z" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} /><circle cx="66" cy="30" r="4" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} /></g>,
  NOR: <g><path d="M 10 5 C 10 5 22 18 22 30 C 22 42 10 55 10 55 C 40 55 60 42 60 30 C 60 18 40 5 10 5 Z" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} /><circle cx="66" cy="30" r="4" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} /></g>,
  XOR: <g><path d="M 0 5 C 0 5 12 18 12 30 C 12 42 0 55 0 55" fill="none" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} /><path d="M 18 5 C 18 5 30 18 30 30 C 30 42 18 55 18 55 C 48 55 68 42 68 30 C 68 18 48 5 18 5 Z" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} /></g>,
  XNOR: <g><path d="M 0 5 C 0 5 12 18 12 30 C 12 42 0 55 0 55" fill="none" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} /><path d="M 18 5 C 18 5 30 18 30 30 C 30 42 18 55 18 55 C 48 55 68 42 68 30 C 68 18 48 5 18 5 Z" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} /><circle cx="74" cy="30" r="4" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} /></g>,
  NAND4: <g><path d="M 10 0 L 10 80 L 35 80 A 40 40 0 0 0 35 0 L 10 0 Z" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} /><circle cx="81" cy="40" r="4" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} /></g>,
  VCC: <g><line x1="20" y1="40" x2="20" y2="15" stroke="currentColor" strokeWidth={2} /><line x1="10" y1="15" x2="30" y2="15" stroke="currentColor" strokeWidth={2} /><text x="20" y="10" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#ef4444">VCC</text></g>,
  GND: <g><line x1="20" y1="0" x2="20" y2="25" stroke="currentColor" strokeWidth={2} /><line x1="10" y1="25" x2="30" y2="25" stroke="currentColor" strokeWidth={2} /><line x1="14" y1="30" x2="26" y2="30" stroke="currentColor" strokeWidth={2} /><line x1="18" y1="35" x2="22" y2="35" stroke="currentColor" strokeWidth={2} /></g>,
  INPUT_STD: <g><rect x="0" y="15" width="40" height="30" rx="6" fill="white" stroke="currentColor" strokeWidth={2} /><text x="20" y="36" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas" fontSize="14" fontWeight="bold" fill="#475569">IN</text></g>,
  OUTPUT_STD: <g><circle cx="20" cy="30" r="16" fill="white" stroke="currentColor" strokeWidth={2} /><text x="20" y="35" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas" fontSize="14" fontWeight="bold" fill="#475569">Y</text></g>,
  INPUT_SIMPLE: <g><line x1="26" y1="30" x2="40" y2="30" stroke="currentColor" strokeWidth={2} /><circle cx="20" cy="30" r="6" fill="white" stroke="currentColor" strokeWidth={2} /></g>,
  OUTPUT_SIMPLE: <g><line x1="5" y1="30" x2="14" y2="30" stroke="currentColor" strokeWidth={2} /><circle cx="20" cy="30" r="6" fill="white" stroke="currentColor" strokeWidth={2} /></g>
};

const GATE_PATHS = { ...SHAPES, INPUT: SHAPES.INPUT_STD, OUTPUT: SHAPES.OUTPUT_STD };

// Hardcoded IC SVGs
// Update: Added overline for active low pins on 74LS138
const IC_SVGS = {
  IC_74LS138: <g>
    <rect x="0" y="0" width="100" height="260" rx="4" fill="white" stroke="currentColor" strokeWidth={2} />
    <text x="50" y="25" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#334155">74LS138</text>
    {/* Inputs A, B, C */}
    <text x="8" y="55" fontSize="12" fill="#64748b" dominantBaseline="middle">A</text>
    <text x="8" y="75" fontSize="12" fill="#64748b" dominantBaseline="middle">B</text>
    <text x="8" y="95" fontSize="12" fill="#64748b" dominantBaseline="middle">C</text>
    {/* Enable Inputs */}
    <text x="8" y="125" fontSize="12" fill="#64748b" dominantBaseline="middle">G1</text>
    {/* G2A Active Low */}
    <circle cx="5" cy="145" r="3" fill="white" stroke="#64748b" strokeWidth="1.5"/>
    <text x="12" y="145" fontSize="12" fill="#64748b" dominantBaseline="middle" textDecoration="overline">G2A</text>
    {/* G2B Active Low */}
    <circle cx="5" cy="165" r="3" fill="white" stroke="#64748b" strokeWidth="1.5"/>
    <text x="12" y="165" fontSize="12" fill="#64748b" dominantBaseline="middle" textDecoration="overline">G2B</text>
    {/* Outputs Y0-Y7 Active Low */}
    {[0,1,2,3,4,5,6,7].map(i => (
      <React.Fragment key={i}>
        <text x="92" y={85 + i*20} textAnchor="end" fontSize="12" fill="#64748b" dominantBaseline="middle" textDecoration="overline">Y{i}</text>
        <circle cx="96" cy={85 + i*20} r="3" fill="white" stroke="currentColor" strokeWidth={1.5} />
      </React.Fragment>
    ))}
  </g>,
  IC_74LS153: <g>
    <rect x="0" y="0" width="100" height="320" rx="4" fill="white" stroke="currentColor" strokeWidth={2} />
    <text x="50" y="25" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#334155">74LS153</text>
    <line x1="5" y1="85" x2="95" y2="85" stroke="#e2e8f0" strokeDasharray="3 3"/>
    <text x="8" y="50" fontSize="12" fill="#64748b" dominantBaseline="middle">A</text>
    <text x="8" y="70" fontSize="12" fill="#64748b" dominantBaseline="middle">B</text>
    <text x="12" y="105" fontSize="11" fill="#64748b" dominantBaseline="middle">1G</text>
    <circle cx="5" cy="105" r="3" fill="white" stroke="#64748b" strokeWidth="1.5"/>
    <text x="8" y="125" fontSize="11" fill="#64748b" dominantBaseline="middle">1C0</text>
    <text x="8" y="145" fontSize="11" fill="#64748b" dominantBaseline="middle">1C1</text>
    <text x="8" y="165" fontSize="11" fill="#64748b" dominantBaseline="middle">1C2</text>
    <text x="8" y="185" fontSize="11" fill="#64748b" dominantBaseline="middle">1C3</text>
    <text x="92" y="145" textAnchor="end" fontSize="14" fontWeight="bold" fill="#334155" dominantBaseline="middle">1Y</text>
    <line x1="5" y1="195" x2="95" y2="195" stroke="#e2e8f0" strokeDasharray="3 3"/>
    <text x="12" y="215" fontSize="11" fill="#64748b" dominantBaseline="middle">2G</text>
    <circle cx="5" cy="215" r="3" fill="white" stroke="#64748b" strokeWidth="1.5"/>
    <text x="8" y="235" fontSize="11" fill="#64748b" dominantBaseline="middle">2C0</text>
    <text x="8" y="255" fontSize="11" fill="#64748b" dominantBaseline="middle">2C1</text>
    <text x="8" y="275" fontSize="11" fill="#64748b" dominantBaseline="middle">2C2</text>
    <text x="8" y="295" fontSize="11" fill="#64748b" dominantBaseline="middle">2C3</text>
    <text x="92" y="255" textAnchor="end" fontSize="14" fontWeight="bold" fill="#334155" dominantBaseline="middle">2Y</text>
  </g>
};

// Static Config
const PORT_CONFIG = {
  AND: { inputs: [{ x: 10, y: 15 }, { x: 10, y: 45 }], outputs: [{ x: 60, y: 30 }] },
  OR: { inputs: [{ x: 12, y: 15 }, { x: 12, y: 45 }], outputs: [{ x: 60, y: 30 }] },
  NOT: { inputs: [{ x: 10, y: 30 }], outputs: [{ x: 60, y: 30 }] },
  NAND: { inputs: [{ x: 10, y: 15 }, { x: 10, y: 45 }], outputs: [{ x: 70, y: 30 }] },
  NOR: { inputs: [{ x: 12, y: 15 }, { x: 12, y: 45 }], outputs: [{ x: 70, y: 30 }] },
  XOR: { inputs: [{ x: 5, y: 15 }, { x: 5, y: 45 }], outputs: [{ x: 68, y: 30 }] },
  XNOR: { inputs: [{ x: 5, y: 15 }, { x: 5, y: 45 }], outputs: [{ x: 78, y: 30 }] },
  NAND4: { inputs: [{ x: 10, y: 10 }, { x: 10, y: 30 }, { x: 10, y: 50 }, { x: 10, y: 70 }], outputs: [{ x: 85, y: 40 }] },
  VCC: { inputs: [], outputs: [{ x: 20, y: 40 }] },
  GND: { inputs: [{ x: 20, y: 0 }], outputs: [{ x: 20, y: 0 }] },
  INPUT: { inputs: [], outputs: [{ x: 40, y: 30 }] },
  OUTPUT: { inputs: [{ x: 5, y: 30 }], outputs: [] },

  IC_74LS138: {
    inputs: [ { x: 0, y: 55 }, { x: 0, y: 75 }, { x: 0, y: 95 }, { x: 0, y: 125 }, { x: 0, y: 145 }, { x: 0, y: 165 } ],
    outputs: [ { x: 100, y: 85 }, { x: 100, y: 105 }, { x: 100, y: 125 }, { x: 100, y: 145 }, { x: 100, y: 165 }, { x: 100, y: 185 }, { x: 100, y: 205 }, { x: 100, y: 225 } ]
  },
  IC_74LS153: {
    inputs: [ { x: 0, y: 50 }, { x: 0, y: 70 }, { x: 0, y: 105 }, { x: 0, y: 125 }, { x: 0, y: 145 }, { x: 0, y: 165 }, { x: 0, y: 185 }, { x: 0, y: 215 }, { x: 0, y: 235 }, { x: 0, y: 255 }, { x: 0, y: 275 }, { x: 0, y: 295 } ],
    outputs: [ { x: 100, y: 145 }, { x: 100, y: 255 } ]
  },
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// ... (Routing, Parsing, Synthesis Logic remains same as v6.2) ...
const getManhattanPath = (x1, y1, x2, y2, offsetIndex = 0) => {
  const distance = Math.abs(x2 - x1);
  let baseMidX = (x1 + x2) / 2;
  const levelsCrossed = Math.round(distance / LEVEL_WIDTH);
  if (levelsCrossed >= 1) {
    const firstGutter = Math.min(x1, x2) + LEVEL_WIDTH * 0.55;
    if (distance > LEVEL_WIDTH * 0.8) baseMidX = firstGutter;
  }
  const laneSpacing = 8;
  const lane = (offsetIndex % 10) - 4.5;
  const laneShift = lane * laneSpacing;
  let effectiveMidX = baseMidX + laneShift;
  const minSafe = Math.min(x1, x2) + 25;
  const maxSafe = Math.max(x1, x2) - 25;
  effectiveMidX = Math.max(minSafe, Math.min(maxSafe, effectiveMidX));
  return `M ${x1} ${y1} L ${effectiveMidX} ${y1} L ${effectiveMidX} ${y2} L ${x2} ${y2}`;
};
const tokenize = (expr) => expr.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ').replace(/,/g, ' , ').replace(/=/g, ' = ').toUpperCase().trim().split(/\s+/);
class ExpressionParser {
  constructor(tokens) { this.tokens = tokens; this.pos = 0; }
  peek() { return this.tokens[this.pos]; }
  consume() { return this.tokens[this.pos++]; }
  parse() { return this.parseExpression(); }
  parseExpression() {
    let left = this.parseTerm();
    while (['OR', 'NOR', 'XOR', 'XNOR'].includes(this.peek())) {
      const op = this.consume();
      left = { type: op, children: [left, this.parseTerm()] };
    }
    return left;
  }
  parseTerm() {
    let left = this.parseFactor();
    while (['AND', 'NAND'].includes(this.peek())) {
      const op = this.consume();
      left = { type: op, children: [left, this.parseFactor()] };
    }
    return left;
  }
  parseFactor() {
    const token = this.peek();
    if (token === 'NOT') { this.consume(); return { type: 'NOT', children: [this.parseFactor()] }; }
    else if (token === '(') {
        this.consume();
        const expr = this.parseExpression();
        if (this.peek() === ')') this.consume();
        return expr;
    } else {
        const name = this.consume();
        if (this.peek() === '(') {
            this.consume();
            const children = [];
            if (this.peek() !== ')') {
                children.push(this.parseExpression());
                while (this.peek() === ',') { this.consume(); children.push(this.parseExpression()); }
            }
            if (this.peek() === ')') this.consume();
            return { type: name, children };
        } else { return { type: 'VAR', value: name }; }
    }
  }
}
class LogicSynthesizer {
  constructor(allowedGates) { this.allowed = allowedGates; this.maxDepth = 30; }
  flatten(node) {
    if (!node || node.type === 'VAR') return node;
    const newChildren = node.children.map(c => this.flatten(c));
    if (['AND', 'OR'].includes(node.type)) {
      let flatChildren = [];
      newChildren.forEach(child => {
        if (child.type === node.type) flatChildren = [...flatChildren, ...child.children];
        else flatChildren.push(child);
      });
      return { ...node, children: flatChildren };
    }
    return { ...node, children: newChildren };
  }
  synthesize(node, depth = 0) {
    if (depth > this.maxDepth) throw new Error("Logic too deep");
    if (!node) return null;
    if (node.type === 'VAR') return node;
    const childCount = node.children.length;
    if (node.type === 'NAND4') {
        if (this.allowed.has('NAND4') && childCount <= 4) return { ...node, children: this.padInputs(node.children.map(c => this.synthesize(c, depth + 1)), 4) };
        return this.synthesize({ type: 'NOT', children: [{ type: 'AND', children: node.children }] }, depth);
    }
    if (this.allowed.has(node.type) && childCount <= 2) return { ...node, children: node.children.map(c => this.synthesize(c, depth + 1)) };
    if (node.type === 'AND' && childCount > 2 && childCount <= 4 && this.allowed.has('NAND4') && this.allowed.has('NOT')) return { type: 'NOT', children: [{ type: 'NAND4', children: this.padInputs(node.children.map(c => this.synthesize(c, depth + 1)), 4) }] };
    if (childCount > 2) {
      let current = node.children[0];
      for (let i = 1; i < childCount; i++) current = { type: node.type, children: [current, node.children[i]] };
      return this.synthesize(current, depth);
    }
    const left = this.synthesize(node.children[0], depth + 1);
    const right = node.children[1] ? this.synthesize(node.children[1], depth + 1) : null;
    if (this.allowed.has(node.type)) return { type: node.type, children: right ? [left, right] : [left] };
    if (node.type === 'AND') {
      if (this.allowed.has('NAND') && this.allowed.has('NOT')) return { type: 'NOT', children: [{ type: 'NAND', children: [left, right] }] };
      if (this.allowed.has('NOR') && this.allowed.has('NOT')) return { type: 'NOR', children: [this.makeNot(left), this.makeNot(right)] };
    }
    else if (node.type === 'OR') {
      if (this.allowed.has('NOR') && this.allowed.has('NOT')) return { type: 'NOT', children: [{ type: 'NOR', children: [left, right] }] };
      if (this.allowed.has('NAND') && this.allowed.has('NOT')) return { type: 'NAND', children: [this.makeNot(left), this.makeNot(right)] };
    }
    else if (node.type === 'NOT') {
      if (this.allowed.has('NAND')) return { type: 'NAND', children: [left, left] };
      if (this.allowed.has('NAND4')) return { type: 'NAND4', children: [left, left, left, left] };
      if (this.allowed.has('NOR')) return { type: 'NOR', children: [left, left] };
    }
    else if (node.type === 'NAND') {
      if (this.allowed.has('AND') && this.allowed.has('NOT')) return { type: 'NOT', children: [{ type: 'AND', children: [left, right] }] };
      if (this.allowed.has('NAND4')) return { type: 'NAND4', children: [left, right, left, right] };
    }
    else if (node.type === 'XNOR') {
        if (this.allowed.has('XOR') && this.allowed.has('NOT')) return { type: 'NOT', children: [{ type: 'XOR', children: [left, right] }] };
    }
    throw new Error("Cannot synthesize gate");
  }
  makeNot(node) { return this.synthesize({ type: 'NOT', children: [node] }); }
  padInputs(inputs, targetCount) {
    const res = [...inputs];
    while (res.length < targetCount) res.push(res[res.length - 1]);
    return res;
  }
}

// --- Main Component ---
export default function LogicCircuitDesigner() {
  const [elements, setElements] = useState([]);
  const [wires, setWires] = useState([]);
  const [draggingId, setDraggingId] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showGenerator, setShowGenerator] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showChipWizard, setShowChipWizard] = useState(false); // New Wizard State
  const [aiPrompt, setAiPrompt] = useState("");
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [expression, setExpression] = useState("F=WX+YZ′+W′X′Y′Z′+W′XY′Z");
  const svgRef = useRef(null);
  const [generateError, setGenerateError] = useState(null);
  const [allowedGates, setAllowedGates] = useState({ AND: true, OR: true, NOT: true, NAND: true, NAND4: true, NOR: true, XOR: true, XNOR: true });
  const [appearance, setAppearance] = useState({ simpleIO: false });
  const [lang, setLang] = useState('zh');
  const [customChips, setCustomChips] = useState([]); // Store custom chips

  // Wizard State
  const [wizardData, setWizardData] = useState({ name: '', width: 100, inputStr: '', outputStr: '' });

  const t = TRANSLATIONS[lang];

  // Load custom chips on mount
  useEffect(() => {
    const saved = localStorage.getItem('customChips');
    if (saved) {
        try { setCustomChips(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  const saveCustomChip = () => {
      const inputs = wizardData.inputStr.split(',').map(s => s.trim()).filter(s => s);
      const outputs = wizardData.outputStr.split(',').map(s => s.trim()).filter(s => s);
      if (!wizardData.name) return alert("请输入芯片名称");
      if (inputs.length === 0 && outputs.length === 0) return alert("请至少定义一个引脚");

      const newChip = {
          id: `CUSTOM_${Date.now()}`,
          name: wizardData.name,
          width: wizardData.width,
          inputs,
          outputs,
          height: 50 + Math.max(inputs.length, outputs.length) * 20 // Auto height
      };

      const updated = [...customChips, newChip];
      setCustomChips(updated);
      localStorage.setItem('customChips', JSON.stringify(updated));
      setShowChipWizard(false);
      setWizardData({ name: '', width: 100, inputStr: '', outputStr: '' });
  };

  // --- Helper to get port positions for dynamic chips ---
  const getPortPos = (elementId, portType, index) => {
    const el = elements.find(e => e.id === elementId);
    if (!el) return { x: 0, y: 0 };

    // 1. Static Config
    if (PORT_CONFIG[el.type]) {
        const config = PORT_CONFIG[el.type];
        if (portType === 'input') {
            const relPos = config.inputs[index] || { x: 0, y: 0 };
            return { x: el.x + relPos.x, y: el.y + relPos.y };
        } else {
            const outIdx = index || 0;
            const relPos = config.outputs[outIdx] || { x: 0, y: 0 };
            return { x: el.x + relPos.x, y: el.y + relPos.y };
        }
    }

    // 2. Custom Chips
    if (el.type.startsWith('CUSTOM_')) {
        const chipDef = customChips.find(c => c.id === el.type);
        if (!chipDef) return { x: el.x, y: el.y };

        if (portType === 'input') {
            // Inputs on left: x=0, y starts at 45, +20 step
            return { x: el.x, y: el.y + 45 + (index * 20) };
        } else {
            // Outputs on right: x=width, y starts at 45? or distribute?
            // Let's align simple top-down for now
            return { x: el.x + chipDef.width, y: el.y + 45 + ((index || 0) * 20) };
        }
    }

    return { x: el.x, y: el.y };
  };

  // --- Render Gates (Static + Dynamic) ---
  const renderGate = (el) => {
    // 1. Standard Shapes
    if (el.type === 'INPUT') return appearance.simpleIO ? GATE_PATHS.INPUT_SIMPLE : GATE_PATHS.INPUT_STD;
    if (el.type === 'OUTPUT') return appearance.simpleIO ? GATE_PATHS.OUTPUT_SIMPLE : GATE_PATHS.OUTPUT_STD;
    if (GATE_PATHS[el.type]) return GATE_PATHS[el.type];
    if (IC_SVGS[el.type]) return IC_SVGS[el.type]; // Hardcoded ICs

    // 2. Custom Chips
    if (el.type.startsWith('CUSTOM_')) {
        const chip = customChips.find(c => c.id === el.type);
        if (!chip) return <rect width="50" height="50" fill="red" />;

        return (
            <g>
                <rect x="0" y="0" width={chip.width} height={chip.height} rx="4" fill="white" stroke="currentColor" strokeWidth={2} />
                <text x={chip.width/2} y="25" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#334155" style={{ pointerEvents: 'none' }}>{chip.name}</text>
                {/* Inputs */}
                {chip.inputs.map((label, i) => (
                    <text key={`in-${i}`} x="8" y={45 + i*20} fontSize="10" fill="#64748b" dominantBaseline="middle">{label}</text>
                ))}
                {/* Outputs */}
                {chip.outputs.map((label, i) => (
                    <text key={`out-${i}`} x={chip.width - 8} y={45 + i*20} textAnchor="end" fontSize="10" fill="#64748b" dominantBaseline="middle">{label}</text>
                ))}
            </g>
        );
    }
    return null;
  };

  // ... (Handlers: Wheel, Pan, MouseMove etc. same as before) ...
  const getMouseWorldPos = (e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    const svgX = (e.clientX - CTM.e) / CTM.a;
    const svgY = (e.clientY - CTM.f) / CTM.d;
    return { x: (svgX - view.x) / view.k, y: (svgY - view.y) / view.k };
  };
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const wheel = e.deltaY < 0 ? 1 : -1;
    let newK = view.k + wheel * zoomIntensity;
    newK = Math.max(0.2, Math.min(newK, 5));
    setView(prev => ({ ...prev, k: newK }));
  };
  const startPan = (e) => {
    if (draggingId !== null || connecting !== null) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  };
  const handleGlobalMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setView(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }
    if (draggingId) {
      const worldPos = getMouseWorldPos(e);
      const snappedX = Math.round(worldPos.x / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.round(worldPos.y / GRID_SIZE) * GRID_SIZE;
      updateElementPos(draggingId, snappedX, snappedY);
    }
  };
  const handleGlobalMouseUp = () => { setIsPanning(false); setDraggingId(null); };
  const handleMouseDown = (e, id) => {
    if (connecting) { setConnecting(null); return; }
    if (id) { e.stopPropagation(); setDraggingId(id); }
    else { startPan(e); }
  };
  const addElement = (type, x, y, label = "") => {
    const id = generateId();
    let finalLabel = label;
    if (!label) {
      if (type.startsWith('IC_') || type.startsWith('CUSTOM_') || type === 'VCC' || type === 'GND') { finalLabel = ''; }
      else {
         const count = elements.filter(e => e.type === type).length;
         finalLabel = type === 'INPUT' ? String.fromCharCode(65 + count) : (type === 'OUTPUT' ? 'Y' : '');
      }
    }
    let finalX = x;
    let finalY = y;
    if (finalX === undefined || finalY === undefined) {
       finalX = (-view.x + 200) / view.k;
       finalY = (-view.y + 200) / view.k;
    }
    setElements(prev => [...prev, { id, type, x: Math.max(50, finalX), y: Math.max(50, finalY), label: finalLabel }]);
  };
  const handleDragStart = (e, type) => { e.dataTransfer.setData('gateType', type); };
  const handleDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('gateType');
    if (!type) return;
    const worldPos = getMouseWorldPos(e);
    const snappedX = Math.round(worldPos.x / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round(worldPos.y / GRID_SIZE) * GRID_SIZE;
    addElement(type, snappedX, snappedY);
  };
  const updateElementPos = (id, x, y) => { setElements(els => els.map(el => el.id === id ? { ...el, x, y } : el)); };
  const deleteElement = (id) => { setElements(els => els.filter(e => e.id !== id)); setWires(ws => ws.filter(w => w.from !== id && w.to !== id)); };
  const clearCanvas = () => { setElements([]); setWires([]); };

  // Export & Clipboard handlers (Same as v6.2)
  const handleExport = () => {
    if (!svgRef.current) return;
    const clone = svgRef.current.cloneNode(true);
    const uiElements = clone.querySelectorAll(".no-export");
    uiElements.forEach(el => el.remove());
    const gContent = clone.querySelector(".content-layer");
    if (gContent) gContent.setAttribute("transform", "");
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elements.forEach(el => {
       if (el.x < minX) minX = el.x;
       if (el.y < minY) minY = el.y;
       if (el.x > maxX) maxX = el.x;
       if (el.y > maxY) maxY = el.y;
    });
    const padding = 100;
    const width = (maxX - minX) + padding * 2 || 800;
    const height = (maxY - minY) + padding * 2 || 600;
    const viewBoxX = (minX - padding) || 0;
    const viewBoxY = (minY - padding) || 0;
    clone.setAttribute('width', width);
    clone.setAttribute('height', height);
    clone.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${width} ${height}`);
    clone.style.backgroundColor = "#F8FAFC";
    const svgData = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 3;
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = 'logic_circuit.png';
      a.href = pngUrl;
      a.click();
      a.revokeObjectURL(url);
    };
    img.src = url;
  };
  const copyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try { document.execCommand('copy'); } catch (err) {}
    document.body.removeChild(textArea);
  };
  const handleGeneratePrompt = () => {
    const selectedGates = Object.keys(allowedGates).filter(k => allowedGates[k]).join(', ');
    let finalPrompt = "";

    if (lang === 'zh') {
      finalPrompt = `
你是一个逻辑电路合成助手。
任务：将用户的逻辑描述或布尔表达式转换为电路生成器所需的严格函数调用格式。
规则：
1. 格式：输出变量 = 门类型(输入1, 输入2, ...)
2. 允许的逻辑门：[${selectedGates}]
3. 嵌套调用：对于复杂逻辑使用嵌套。例如：Y = AND(A, OR(B, C))
4. 多输出：每个输出变量占一行。
5. 不要使用 Markdown 代码块，不要包含任何解释文本，仅输出等式。
用户输入："${expression}"`.trim();
    } else {
      finalPrompt = `
You are a Logic Circuit Synthesis Assistant. 
Task: Convert the user's logic description or boolean expression into a strict function-call format for a circuit generator.
Rules:
1. Format: OUTPUT_VAR = GATE(INPUT1, INPUT2, ...)
2. Allowed Gates: [${selectedGates}]
3. Nested Calls: Use nesting for complex logic. Example: Y = AND(A, OR(B, C))
4. Multiple Outputs: Use separate lines for each output variable.
5. NO Markdown code blocks, NO explanations. Just the equations.
User Input: "${expression}"`.trim();
    }

    setAiPrompt(finalPrompt);
    setShowPromptModal(true);
  };
  const generateFromExpression = () => {
    setGenerateError(null);
    try {
      const allowedSet = new Set(Object.keys(allowedGates).filter(k => allowedGates[k]));
      if (allowedSet.size === 0) throw new Error("请至少选择一种允许的逻辑门。");
      const synthesizer = new LogicSynthesizer(allowedSet);
      const nodes = [];
      const wiresData = [];
      const inputsMap = new Map();
      const orderedInputs = [];
      const lines = expression.split('\n').filter(line => line.trim() !== '');
      let maxLevel = 0;
      const outputNodes = [];
      lines.forEach(line => {
        let exprStr = line.includes('=') ? line.split('=')[1].trim() : line;
        const tokens = tokenize(exprStr);
        const vars = [...new Set(tokens.filter(t => !['AND','OR','NOT','NAND','NOR','XOR','XNOR','NAND4','(',')','=',','].includes(t)))];
        vars.forEach(v => {
          if (!inputsMap.has(v)) {
            const id = generateId();
            const node = { id, type: 'INPUT', label: v, children: [], level: 0 };
            inputsMap.set(v, node);
            orderedInputs.push(node);
            nodes.push(node);
          }
        });
      });
      lines.forEach((line, lineIdx) => {
        let label = `Y${lineIdx + 1}`;
        let exprStr = line;
        if (line.includes('=')) {
          const parts = line.split('=');
          label = parts[0].trim();
          exprStr = parts[1].trim();
        }
        const tokens = tokenize(exprStr);
        const parser = new ExpressionParser(tokens);
        let ast = parser.parse();
        if (!ast) return;
        ast = synthesizer.flatten(ast);
        ast = synthesizer.synthesize(ast);
        const buildNetlist = (node) => {
          if (node.type === 'VAR') return inputsMap.get(node.value);
          const id = generateId();
          const childNodes = node.children.map(c => buildNetlist(c));
          let level = 0;
          childNodes.forEach(c => level = Math.max(level, c.level));
          level += 1;
          const gateNode = { id, type: node.type, label: '', children: childNodes, level, groupIndex: lineIdx };
          nodes.push(gateNode);
          childNodes.forEach((child, index) => wiresData.push({ from: child.id, to: id, toIndex: index }));
          return gateNode;
        };
        const rootNode = buildNetlist(ast);
        const outId = generateId();
        const outNode = { id: outId, type: 'OUTPUT', label: label, children: [rootNode], inputNode: rootNode, groupIndex: lineIdx };
        outputNodes.push(outNode);
        if (rootNode.level > maxLevel) maxLevel = rootNode.level;
      });
      outputNodes.forEach(outNode => {
        outNode.level = maxLevel + 1;
        nodes.push(outNode);
        wiresData.push({ from: outNode.inputNode.id, to: outNode.id, toIndex: 0 });
      });
      const levels = [];
      nodes.forEach(node => {
        if (!levels[node.level]) levels[node.level] = [];
        levels[node.level].push(node);
      });
      const nodePositions = new Map();
      orderedInputs.forEach((node, idx) => nodePositions.set(node.id, { x: 50, y: 100 + idx * INPUT_ROW_HEIGHT }));
      for (let i = 1; i < levels.length; i++) {
        const currentLevelNodes = levels[i] || [];
        currentLevelNodes.forEach(node => {
          let sumY = 0;
          node.children.forEach(inputNode => {
            const inputPos = nodePositions.get(inputNode.id);
            if (inputPos) sumY += inputPos.y;
          });
          node._idealY = node.children.length > 0 ? sumY / node.children.length : 100;
        });
        currentLevelNodes.sort((a, b) => {
          const diff = a._idealY - b._idealY;
          if (Math.abs(diff) < 20) return a.groupIndex - b.groupIndex;
          return diff;
        });
        for (let j = 0; j < currentLevelNodes.length; j++) {
          const node = currentLevelNodes[j];
          let finalY = node._idealY;
          if (j > 0) {
            const prevNode = currentLevelNodes[j - 1];
            const prevY = nodePositions.get(prevNode.id).y;
            const minAllowedY = prevY + MIN_NODE_GAP;
            if (finalY < minAllowedY) finalY = minAllowedY;
          }
          nodePositions.set(node.id, { x: 50 + i * LEVEL_WIDTH, y: finalY });
        }
      }
      const finalElements = nodes.map(n => {
        const pos = nodePositions.get(n.id);
        return { id: n.id, type: n.type, x: pos.x, y: pos.y, label: n.label };
      });
      const finalWires = wiresData.map(w => ({
        id: generateId(),
        from: w.from, fromIndex: null, to: w.to, toIndex: w.toIndex
      }));
      setElements(finalElements);
      setWires(finalWires);
      setShowGenerator(false);
    } catch (e) {
      setGenerateError(e.message);
    }
  };

  const handlePortClick = (e, elementId, type, index) => {
    e.stopPropagation();
    if (connecting) {
      if (connecting.elementId === elementId) { setConnecting(null); return; }
      let source, target;
      if (connecting.portType === 'output' && type === 'input') {
          source = connecting;
          target = { elementId, portType: type, portIndex: index };
      } else if (connecting.portType === 'input' && type === 'output') {
          source = { elementId, portType: type, portIndex: index };
          target = connecting;
      } else {
          setConnecting(null);
          return;
      }
      setWires([...wires, { id: generateId(), from: source.elementId, fromIndex: source.portIndex, to: target.elementId, toIndex: target.portIndex }]);
      setConnecting(null);
    } else {
        setConnecting({ elementId, portType: type, portIndex: index });
    }
  };

  return (
    <>
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700" onMouseMove={handleGlobalMouseMove} onMouseUp={handleGlobalMouseUp} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
      <div className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between z-20 shadow-sm relative">
        <div className="flex items-center gap-4"><div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200"><Layout className="text-white w-5 h-5" strokeWidth={2.5} /></div><div><h1 className="text-xl font-bold tracking-tight text-slate-900">LogicCircuit <span className="text-indigo-600">Gen</span></h1><div className="flex items-center gap-2 text-xs font-medium text-slate-500 mt-0.5"><span>v6.4.2</span><span className="w-1 h-1 bg-slate-300 rounded-full"></span><span className="flex items-center gap-1">{t.by} <a href="https://github.com/budoyh" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-medium">不懂</a></span><a href="https://github.com/budoyh/logic-circuit-designer" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors ml-1" title={t.viewSource}><Github size={14} /></a></div></div></div>
        <div className="flex items-center gap-3">
           {/* New Chip Button */}
           <button onClick={() => setShowChipWizard(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all border text-sm font-medium bg-white text-slate-600 border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600"><PlusSquare size={16} /><span>{t.newChip}</span></button>

           <button onClick={() => setLang(l => l === 'zh' ? 'en' : 'zh')} className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all border text-sm font-medium bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"><Globe size={16} /><span>{t.language}</span></button>
           <button onClick={() => setShowAppearance(!showAppearance)} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all border text-sm font-medium ${showAppearance ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}><Eye size={16} /><span>{t.appearance}</span></button>
           {showAppearance && (<div className="absolute top-20 right-40 bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/20 ring-1 ring-black/5 w-64 z-50 animate-in fade-in zoom-in-95 origin-top-right"><h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Settings size={12}/> {t.settings}</h4><div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group" onClick={() => setAppearance(prev => ({ ...prev, simpleIO: !prev.simpleIO }))}><span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700 transition-colors">{t.simpleNode}</span>{appearance.simpleIO ? <CheckSquare className="text-indigo-600 w-5 h-5"/> : <Square className="text-slate-300 w-5 h-5 group-hover:text-slate-400"/>}</div><p className="text-[10px] text-slate-400 mt-2 px-2 leading-relaxed">{t.simpleNodeDesc}</p></div>)}
           <button onClick={() => setShowGenerator(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg font-medium shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all active:translate-y-0 active:shadow-none"><Wand2 size={16} /><span>{t.smartGen}</span></button>
           <button onClick={() => setShowWelcome(true)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><HelpCircle size={20} /></button>
        </div>
      </div>

      {/* Chip Wizard Modal */}
      {showChipWizard && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-[500px] overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20 ring-1 ring-black/5">
             <div className="flex justify-between items-center p-5 border-b border-slate-100"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Cpu size={18} className="text-indigo-500"/> {t.chipWizardTitle}</h3><button onClick={() => setShowChipWizard(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
             <div className="p-6 space-y-4 bg-slate-50/50">
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{t.chipName}</label>
                  <input type="text" value={wizardData.name} onChange={e => setWizardData({...wizardData, name: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="e.g. 74LS00" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{t.chipWidth} (px)</label>
                  <input type="number" value={wizardData.width} onChange={e => setWizardData({...wizardData, width: parseInt(e.target.value) || 100})} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{t.leftPins}</label>
                  <textarea value={wizardData.inputStr} onChange={e => setWizardData({...wizardData, inputStr: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm h-20 resize-none" placeholder={t.pinsPlaceholder} />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{t.rightPins}</label>
                  <textarea value={wizardData.outputStr} onChange={e => setWizardData({...wizardData, outputStr: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm h-20 resize-none" placeholder={t.pinsPlaceholder} />
               </div>
             </div>
             <div className="p-5 border-t border-slate-100 bg-white flex justify-end gap-3">
               <button onClick={() => setShowChipWizard(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">{t.cancel}</button>
               <button onClick={saveCustomChip} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2 shadow-md transition-all hover:-translate-y-0.5"><Save size={16} /> {t.saveChip}</button>
             </div>
          </div>
        </div>
      )}

      {showWelcome && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-[650px] overflow-hidden animate-in slide-in-from-bottom-8 duration-300 border border-white/20 ring-1 ring-black/5">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              <h2 className="text-3xl font-bold mb-2 relative z-10">{t.welcomeTitle}</h2>
              <p className="text-indigo-100 relative z-10">{t.subtitle}</p>
              <button onClick={() => setShowWelcome(false)} className="absolute top-6 right-6 text-white/70 hover:text-white hover:bg-white/20 rounded-full p-1 transition-colors"><X size={24} /></button>
            </div>
            <div className="p-8">
              <div className="flex gap-6 mb-8">
                <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow group">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><User size={24}/></div>
                  <h4 className="font-bold text-slate-800 mb-1">{t.author}: 不懂</h4>
                  <a href="https://github.com/budoyh" target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">{t.githubProfile} <ExternalLink size={10}/></a>
                </div>
                <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow group">
                  <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Github size={24}/></div>
                  <h4 className="font-bold text-slate-800 mb-1">LogicCircuit Gen</h4>
                  <a href="https://github.com/budoyh/logic-circuit-designer" target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">{t.projectRepo} <ExternalLink size={10}/></a>
                </div>
              </div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><BookOpen size={14}/> {t.guideTitle}</h3>
              <ul className="space-y-3 text-slate-600 text-sm mb-8">
                <li className="flex gap-3 items-start"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 shrink-0"></span>{t.guideStep1}</li>
                <li className="flex gap-3 items-start"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 shrink-0"></span>{t.guideStep2}</li>
                <li className="flex gap-3 items-start"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 shrink-0"></span>{t.guideStep3}</li>
                <li className="flex gap-3 items-start"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 shrink-0"></span>{t.guideStep4}</li>
              </ul>
              <p className="text-xs text-slate-400 text-center mb-6 bg-slate-50 p-2 rounded-lg border border-slate-100">
                {t.moreInfo}
              </p>
              <button onClick={() => setShowWelcome(false)} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">{t.startUsing}</button>
            </div>
          </div>
        </div>
      )}

      {showGenerator && (
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-start justify-center pt-24 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-[800px] flex flex-col max-h-[85vh] overflow-hidden border border-white/20 ring-1 ring-black/5 animate-in slide-in-from-bottom-8 zoom-in-95 duration-300">
            <div className="flex-1 flex flex-col p-0">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50"><h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Wand2 className="w-5 h-5 text-indigo-500"/> {t.genCircuit}</h3><button onClick={() => setShowGenerator(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button></div>
              <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 p-6 flex flex-col bg-white"><div className="mb-2 flex justify-between items-center"><label className="text-sm font-semibold text-slate-700">{t.logicExpr}</label><button onClick={handleGeneratePrompt} className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50 rounded-md transition-colors"><MessageSquare size={12} /> {t.aiAssist}</button></div><div className="relative flex-1"><textarea value={expression} onChange={(e) => setExpression(e.target.value)} className="w-full h-full p-4 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-mono text-slate-700 leading-relaxed resize-none shadow-inner" placeholder="Y = ABC + A'BD" /></div>{generateError && <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg flex items-start gap-2 text-xs"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{generateError}</span></div>}</div>
                <div className="w-72 bg-slate-50 border-l border-slate-200 p-6 overflow-y-auto"><h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Settings size={12}/> {t.allowedGates}</h4><div className="grid grid-cols-1 gap-2">{Object.keys(allowedGates).map(gate => (<label key={gate} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border ${allowedGates[gate] ? 'bg-white border-indigo-200 shadow-sm' : 'border-transparent hover:bg-slate-100'}`}><div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${allowedGates[gate] ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}><input type="checkbox" checked={allowedGates[gate]} onChange={(e) => setAllowedGates({...allowedGates, [gate]: e.target.checked})} className="hidden"/>{allowedGates[gate] && <CheckSquare size={14} className="text-white" />}</div><span className={`text-sm font-medium ${allowedGates[gate] ? 'text-indigo-900' : 'text-slate-600'}`}>{gate === 'NAND' ? t.nand2 : (gate === 'NAND4' ? t.nand4 : (gate === 'XNOR' ? t.xnor : gate))}</span></label>))}</div></div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3"><button onClick={() => setShowGenerator(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors">{t.cancel}</button><button onClick={generateFromExpression} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 active:translate-y-0">{t.genCircuit}</button></div>
          </div>
        </div>
      )}

      {showPromptModal && (<div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in"><div className="bg-white rounded-2xl shadow-2xl w-[600px] flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200"><div className="flex justify-between items-center p-5 border-b border-slate-100"><h3 className="font-bold text-slate-800 flex items-center gap-2"><MessageSquare size={18} className="text-purple-500"/> {t.aiPromptTitle}</h3><button onClick={() => setShowPromptModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div><div className="p-6 flex-1 overflow-auto bg-slate-50/50"><p className="text-sm text-slate-500 mb-3">{t.aiPromptDesc}</p><div className="bg-white border border-slate-200 p-4 rounded-xl text-xs font-mono text-slate-600 whitespace-pre-wrap leading-relaxed shadow-sm">{aiPrompt}</div></div><div className="p-5 border-t border-slate-100 bg-white flex justify-end gap-3"><button onClick={() => setShowPromptModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">{t.close}</button><button onClick={() => { copyToClipboard(aiPrompt); setShowPromptModal(false); }} className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2 shadow-md shadow-purple-100 transition-all hover:-translate-y-0.5"><Copy size={16} /> {t.copyClose}</button></div></div></div>)}

      <div className="flex flex-1 overflow-hidden relative">
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col p-5 gap-8 overflow-y-auto z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <div><h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><ArrowRightLeft size={12} /> {t.input} / {t.output}</h3><div className="grid grid-cols-2 gap-3"><PaletteItem type="INPUT" onClick={() => addElement('INPUT')} onDragStart={(e) => handleDragStart(e, 'INPUT')} label="Input" /><PaletteItem type="OUTPUT" onClick={() => addElement('OUTPUT')} onDragStart={(e) => handleDragStart(e, 'OUTPUT')} label="Output" /></div></div>
          <div><h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Grid size={12} /> {t.basicGates}</h3><div className="grid grid-cols-2 gap-3"><PaletteItem type="AND" onClick={() => addElement('AND')} onDragStart={(e) => handleDragStart(e, 'AND')} /><PaletteItem type="OR" onClick={() => addElement('OR')} onDragStart={(e) => handleDragStart(e, 'OR')} /><PaletteItem type="NOT" onClick={() => addElement('NOT')} onDragStart={(e) => handleDragStart(e, 'NOT')} /><PaletteItem type="NAND" onClick={() => addElement('NAND')} onDragStart={(e) => handleDragStart(e, 'NAND')} /><PaletteItem type="NOR" onClick={() => addElement('NOR')} onDragStart={(e) => handleDragStart(e, 'NOR')} /><PaletteItem type="XOR" onClick={() => addElement('XOR')} onDragStart={(e) => handleDragStart(e, 'XOR')} /><PaletteItem type="XNOR" onClick={() => addElement('XNOR')} onDragStart={(e) => handleDragStart(e, 'XNOR')} /></div></div>
          <div><h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Cpu size={12} /> {t.integratedCircuits}</h3><div className="grid grid-cols-2 gap-3"><PaletteItem type="NAND4" onClick={() => addElement('NAND4')} onDragStart={(e) => handleDragStart(e, 'NAND4')} label="4-In NAND" /><PaletteItem type="IC_74LS138" onClick={() => addElement('IC_74LS138')} onDragStart={(e) => handleDragStart(e, 'IC_74LS138')} label="74LS138" viewBoxOverride="0 0 100 280"/><PaletteItem type="IC_74LS153" onClick={() => addElement('IC_74LS153')} onDragStart={(e) => handleDragStart(e, 'IC_74LS153')} label="74LS153" viewBoxOverride="0 0 100 340"/></div></div>

          {/* My Chips Section */}
          {customChips.length > 0 && (
             <div>
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Layers size={12} /> {t.myChips}</h3>
               <div className="grid grid-cols-2 gap-3">
                 {customChips.map(chip => (
                   <PaletteItem key={chip.id} type={chip.id} label={chip.name} onClick={() => addElement(chip.id)} onDragStart={(e) => handleDragStart(e, chip.id)} />
                 ))}
               </div>
             </div>
          )}

          <div><h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Zap size={12} /> {t.powerGround}</h3><div className="grid grid-cols-2 gap-3"><PaletteItem type="VCC" onClick={() => addElement('VCC')} onDragStart={(e) => handleDragStart(e, 'VCC')} label="VCC (5V)" /><PaletteItem type="GND" onClick={() => addElement('GND')} onDragStart={(e) => handleDragStart(e, 'GND')} label="GND" /></div></div>
        </div>

        <div className="flex-1 bg-slate-50/50 relative overflow-hidden cursor-crosshair">
          <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`, backgroundSize: `${GRID_SIZE * view.k}px ${GRID_SIZE * view.k}px`, backgroundPosition: `${view.x}px ${view.y}px` }} />
          <svg ref={svgRef} className="w-full h-full" onMouseDown={(e) => handleMouseDown(e, null)} onWheel={handleWheel}>
            <g className="content-layer" transform={`translate(${view.x}, ${view.y}) scale(${view.k})`}>
              {wires.map((wire, idx) => {
                const startPos = getPortPos(wire.from, 'output', wire.fromIndex);
                const endPos = getPortPos(wire.to, 'input', wire.toIndex);
                return (
                  <g key={wire.id}>
                    <path d={getManhattanPath(startPos.x, startPos.y, endPos.x, endPos.y, idx)} stroke={WIRE_COLOR} strokeWidth={WIRE_WIDTH} fill="none" className="drop-shadow-sm" />
                    <circle cx={startPos.x} cy={startPos.y} r={3} fill={WIRE_COLOR} />
                    <circle cx={endPos.x} cy={endPos.y} r={3} fill={WIRE_COLOR} />
                  </g>
                );
              })}
              {connecting && (
                <path d={getManhattanPath(getPortPos(connecting.elementId, connecting.portType, connecting.portIndex).x, getPortPos(connecting.elementId, connecting.portType, connecting.portIndex).y, (mousePos.x - view.x)/view.k, (mousePos.y - view.y)/view.k)} stroke="blue" strokeWidth={2} strokeDasharray="4 4" fill="none" pointerEvents="none" />
              )}
              {elements.map(el => (
                <g key={el.id} transform={`translate(${el.x},${el.y})`} onMouseDown={(e) => handleMouseDown(e, el.id)} className="cursor-move select-none group">
                  <rect x="-10" y="-30" width={el.type.startsWith('INPUT') || el.type.startsWith('OUTPUT') || el.type === 'VCC' || el.type === 'GND' ? 60 : (el.type.startsWith('IC_') || el.type.startsWith('CUSTOM_') ? (el.type.startsWith('CUSTOM_') ? customChips.find(c=>c.id===el.type)?.width + 20 || 120 : 120) : 90)} height={el.type.startsWith('IC_') ? (el.type === 'IC_74LS138' ? 300 : 360) : (el.type.startsWith('CUSTOM_') ? (customChips.find(c=>c.id===el.type)?.height + 40 || 100) : 100)} fill="transparent" stroke="transparent" />

                  {renderGate(el)}

                  {el.type === 'INPUT' && (
                    <text x={appearance.simpleIO ? -25 : 0} y={36} textAnchor="end" fontFamily="ui-serif, Georgia, Cambria, serif" fontSize="18px" fontWeight="bold" fill="#1e293b" className="pointer-events-none select-none drop-shadow-sm">{el.label}</text>
                  )}
                  {el.type === 'OUTPUT' && (
                    <text x={appearance.simpleIO ? 35 : 45} y={36} textAnchor="start" fontFamily="ui-serif, Georgia, Cambria, serif" fontSize="18px" fontWeight="bold" fill="#1e293b" className="pointer-events-none select-none drop-shadow-sm">{el.label}</text>
                  )}

                  <g className="no-export opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-200 hover:scale-110" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }} transform="translate(0, -20)">
                    <circle r="15" fill="transparent" />
                    <circle r="10" fill="#fee2e2" stroke="#ef4444" strokeWidth="1" className="shadow-sm"/>
                    <path d="M -3 -3 L 3 3 M 3 -3 L -3 3" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                  </g>

                  {PORT_CONFIG[el.type] ? (
                      // Standard Ports
                      <>
                        {PORT_CONFIG[el.type].inputs.map((pos, idx) => (
                          <circle key={`in-${idx}`} cx={pos.x} cy={pos.y} r={5} fill="transparent" stroke="transparent" className="hover:fill-indigo-500 hover:stroke-indigo-200 hover:stroke-4 cursor-crosshair transition-all" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => handlePortClick(e, el.id, 'input', idx)} />
                        ))}
                        {PORT_CONFIG[el.type].outputs.map((pos, idx) => (
                          <circle key={`out-${idx}`} cx={pos.x} cy={pos.y} r={5} fill="transparent" stroke="transparent" className="hover:fill-indigo-500 hover:stroke-indigo-200 hover:stroke-4 cursor-crosshair transition-all" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => handlePortClick(e, el.id, 'output', idx)} />
                        ))}
                      </>
                   ) : (
                      // Custom Chip Ports
                      el.type.startsWith('CUSTOM_') && (() => {
                          const chip = customChips.find(c => c.id === el.type);
                          if(!chip) return null;
                          return (
                              <>
                                {chip.inputs.map((_, idx) => (
                                  <circle key={`cin-${idx}`} cx={0} cy={45 + idx*20} r={5} fill="transparent" stroke="transparent" className="hover:fill-indigo-500 hover:stroke-indigo-200 hover:stroke-4 cursor-crosshair transition-all" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => handlePortClick(e, el.id, 'input', idx)} />
                                ))}
                                {chip.outputs.map((_, idx) => (
                                  <circle key={`cout-${idx}`} cx={chip.width} cy={45 + idx*20} r={5} fill="transparent" stroke="transparent" className="hover:fill-indigo-500 hover:stroke-indigo-200 hover:stroke-4 cursor-crosshair transition-all" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => handlePortClick(e, el.id, 'output', idx)} />
                                ))}
                              </>
                          );
                      })()
                   )}
                </g>
              ))}
            </g>
          </svg>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 ring-1 ring-black/5 z-30 transition-transform hover:scale-105 duration-300">
             <div className="flex items-center gap-1 px-2 border-r border-slate-200/50">
               <button onClick={() => setView(v => ({ ...v, k: Math.max(0.2, v.k - 0.1) }))} className="p-2 hover:bg-white rounded-xl text-slate-500 hover:text-indigo-600 transition-colors"><ZoomOut size={18} /></button>
               <span className="text-xs font-bold text-slate-700 w-12 text-center select-none">{Math.round(view.k * 100)}%</span>
               <button onClick={() => setView(v => ({ ...v, k: Math.min(5, v.k + 0.1) }))} className="p-2 hover:bg-white rounded-xl text-slate-500 hover:text-indigo-600 transition-colors"><ZoomIn size={18} /></button>
             </div>
             <button onClick={() => setView({ x: 0, y: 0, k: 1 })} className="p-2 hover:bg-white rounded-xl text-slate-500 hover:text-indigo-600 transition-colors group relative" title={t.reset}><RotateCcw size={18} /><span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">{t.reset}</span></button>
             <button onClick={clearCanvas} className="p-2 hover:bg-red-50 rounded-xl text-slate-500 hover:text-red-500 transition-colors group relative" title={t.clear}><Trash2 size={18} /><span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">{t.clear}</span></button>
             <div className="w-px h-6 bg-slate-200/50 mx-1"></div>
             <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-slate-200"><Download size={16} /><span>{t.export}</span></button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

function PaletteItem({ type, onClick, onDragStart, label, viewBoxOverride }) {
  // Update: Prioritize IC_SVGS for rendering in Palette
  let displayIcon = null;

  if (IC_SVGS[type]) {
    displayIcon = IC_SVGS[type];
  } else if (GATE_PATHS[type]) {
    displayIcon = GATE_PATHS[type];
  } else if (type.startsWith('CUSTOM_')) {
      // Custom generic icon
      displayIcon = (
          <g>
            <rect x="10" y="5" width="80" height="70" rx="4" fill="white" stroke="currentColor" strokeWidth={2} />
            <line x1="10" y1="20" x2="0" y2="20" stroke="currentColor" strokeWidth={2} />
            <line x1="10" y1="40" x2="0" y2="40" stroke="currentColor" strokeWidth={2} />
            <line x1="10" y1="60" x2="0" y2="60" stroke="currentColor" strokeWidth={2} />
            <line x1="90" y1="30" x2="100" y2="30" stroke="currentColor" strokeWidth={2} />
            <line x1="90" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth={2} />
          </g>
      );
  } else {
    // Fallback
    displayIcon = GATE_PATHS['AND'];
  }

  const vb = viewBoxOverride || "0 0 100 80";

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center p-3 bg-white border border-slate-100 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 hover:border-indigo-100 active:scale-95"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 rounded-2xl opacity-50 group-hover:opacity-0 transition-opacity"></div>
      <div className="mb-2 scale-75 origin-center text-slate-700 group-hover:text-indigo-600 transition-colors duration-300"><svg width="80" height="60" viewBox={vb} className="pointer-events-none overflow-visible">{displayIcon}</svg></div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-500 transition-colors truncate w-full text-center">{label || type}</span>
    </div>
  );
}