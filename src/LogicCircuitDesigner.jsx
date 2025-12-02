import React, { useState, useRef, useEffect } from 'react';
import { Trash2, RotateCcw, Download, FolderOpen, Wand2, X, HelpCircle, Layout, Settings, Image as ImageIcon, AlertTriangle, ArrowRightLeft, MessageSquare, Eye, CheckSquare, Square, Copy, ZoomIn, ZoomOut, Move, Github, Grid, Zap, Layers, Cpu } from 'lucide-react';

/**
 * 逻辑电路设计器 v5.3 (UI Design Overhaul)
 * 核心升级：
 * 1. UI 全面美化：采用 Modern UI / Glassmorphism 设计语言。
 * 2. 悬浮岛式工具栏：将常用操作整合到底部悬浮栏，提升沉浸感。
 * 3. 交互细节优化：组件库卡片增加悬浮微动效，按钮增加渐变和光影。
 * 4. 视觉降噪：简化线条，使用更高级的 Slate 色系。
 */

// --- 基础配置 ---
const GRID_SIZE = 20;
const WIRE_COLOR = "#334155"; // Slate-700 for a softer black
const WIRE_WIDTH = 2;
const GATE_STROKE_WIDTH = 2;
const LEVEL_WIDTH = 200;
const MIN_NODE_GAP = 120;
const INPUT_ROW_HEIGHT = 90;

// --- 组件定义 (SVG Paths) ---
const SHAPES = {
  AND: (
    <path d="M 10 5 L 10 55 L 35 55 A 25 25 0 0 0 35 5 L 10 5 Z" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} />
  ),
  OR: (
    <path d="M 10 5 C 10 5 22 18 22 30 C 22 42 10 55 10 55 C 40 55 60 42 60 30 C 60 18 40 5 10 5 Z" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} />
  ),
  NOT: (
    <g>
      <path d="M 10 10 L 10 50 L 50 30 Z" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} />
      <circle cx="56" cy="30" r="4" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} />
    </g>
  ),
  NAND: (
    <g>
       <path d="M 10 5 L 10 55 L 35 55 A 25 25 0 0 0 35 5 L 10 5 Z" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} />
      <circle cx="66" cy="30" r="4" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} />
    </g>
  ),
  NOR: (
    <g>
      <path d="M 10 5 C 10 5 22 18 22 30 C 22 42 10 55 10 55 C 40 55 60 42 60 30 C 60 18 40 5 10 5 Z" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} />
      <circle cx="66" cy="30" r="4" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} />
    </g>
  ),
  XOR: (
    <g>
      <path d="M 0 5 C 0 5 12 18 12 30 C 12 42 0 55 0 55" fill="none" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} />
      <path d="M 18 5 C 18 5 30 18 30 30 C 30 42 18 55 18 55 C 48 55 68 42 68 30 C 68 18 48 5 18 5 Z" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} />
    </g>
  ),
  NAND4: (
    <g>
      <path d="M 10 0 L 10 80 L 35 80 A 40 40 0 0 0 35 0 L 10 0 Z" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} />
      <circle cx="81" cy="40" r="4" fill="white" stroke="currentColor" strokeWidth={GATE_STROKE_WIDTH} />
    </g>
  ),
  INPUT_STD: (
    <g>
      <rect x="0" y="15" width="40" height="30" rx="6" fill="white" stroke="currentColor" strokeWidth={2} />
      <text x="20" y="36" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas" fontSize="14" fontWeight="bold" fill="#475569">IN</text>
    </g>
  ),
  OUTPUT_STD: (
    <g>
      <circle cx="20" cy="30" r="16" fill="white" stroke="currentColor" strokeWidth={2} />
      <text x="20" y="35" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas" fontSize="14" fontWeight="bold" fill="#475569">Y</text>
    </g>
  ),
  INPUT_SIMPLE: (
    <circle cx="25" cy="30" r="6" fill="white" stroke="currentColor" strokeWidth={2} />
  ),
  OUTPUT_SIMPLE: (
    <circle cx="20" cy="30" r="6" fill="white" stroke="currentColor" strokeWidth={2} />
  )
};

const GATE_PATHS = {
  ...SHAPES,
  INPUT: SHAPES.INPUT_STD,
  OUTPUT: SHAPES.OUTPUT_STD
};

const PORT_CONFIG = {
  AND: { inputs: [{ x: 10, y: 15 }, { x: 10, y: 45 }], output: { x: 60, y: 30 } },
  OR: { inputs: [{ x: 12, y: 15 }, { x: 12, y: 45 }], output: { x: 60, y: 30 } },
  NOT: { inputs: [{ x: 10, y: 30 }], output: { x: 60, y: 30 } },
  NAND: { inputs: [{ x: 10, y: 15 }, { x: 10, y: 45 }], output: { x: 70, y: 30 } },
  NOR: { inputs: [{ x: 12, y: 15 }, { x: 12, y: 45 }], output: { x: 70, y: 30 } },
  XOR: { inputs: [{ x: 5, y: 15 }, { x: 5, y: 45 }], output: { x: 68, y: 30 } },
  NAND4: { inputs: [{ x: 10, y: 10 }, { x: 10, y: 30 }, { x: 10, y: 50 }, { x: 10, y: 70 }], output: { x: 85, y: 40 } },
  INPUT: { inputs: [], output: { x: 40, y: 30 } },
  OUTPUT: { inputs: [{ x: 5, y: 30 }], output: null },
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const getManhattanPath = (x1, y1, x2, y2, offsetIndex = 0) => {
  const distance = Math.abs(x2 - x1);
  let baseMidX = (x1 + x2) / 2;

  const levelsCrossed = Math.round(distance / LEVEL_WIDTH);
  if (levelsCrossed >= 1) {
    const firstGutter = Math.min(x1, x2) + LEVEL_WIDTH * 0.55;
    if (distance > LEVEL_WIDTH * 0.8) {
       baseMidX = firstGutter;
    }
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
    while (['OR', 'NOR', 'XOR'].includes(this.peek())) {
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
    if (token === 'NOT') {
        this.consume();
        return { type: 'NOT', children: [this.parseFactor()] };
    } else if (token === '(') {
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
                while (this.peek() === ',') {
                    this.consume();
                    children.push(this.parseExpression());
                }
            }
            if (this.peek() === ')') this.consume();
            return { type: name, children };
        } else {
            return { type: 'VAR', value: name };
        }
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
    if (depth > this.maxDepth) throw new Error("逻辑转换过深。");
    if (!node) return null;
    if (node.type === 'VAR') return node;

    const childCount = node.children.length;

    if (node.type === 'NAND4') {
        if (this.allowed.has('NAND4') && childCount <= 4) {
             return { ...node, children: this.padInputs(node.children.map(c => this.synthesize(c, depth + 1)), 4) };
        }
        return this.synthesize({ type: 'NOT', children: [{ type: 'AND', children: node.children }] }, depth);
    }

    if (this.allowed.has(node.type) && childCount <= 2) {
       return { ...node, children: node.children.map(c => this.synthesize(c, depth + 1)) };
    }

    if (node.type === 'AND' && childCount > 2 && childCount <= 4 && this.allowed.has('NAND4') && this.allowed.has('NOT')) {
      return { type: 'NOT', children: [{ type: 'NAND4', children: this.padInputs(node.children.map(c => this.synthesize(c, depth + 1)), 4) }] };
    }

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
    throw new Error(`无法生成逻辑门: ${node.type}。`);
  }

  makeNot(node) { return this.synthesize({ type: 'NOT', children: [node] }); }
  padInputs(inputs, targetCount) {
    const res = [...inputs];
    while (res.length < targetCount) res.push(res[res.length - 1]);
    return res;
  }
}

export default function LogicCircuitDesigner() {
  const [elements, setElements] = useState([]);
  const [wires, setWires] = useState([]);
  const [draggingId, setDraggingId] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showGenerator, setShowGenerator] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [expression, setExpression] = useState("Y = NAND4( (NOT (NAND4(R, Y, G, G))), (R NAND Y), (R NAND G), (Y NAND G) )");

  const svgRef = useRef(null);
  const [generateError, setGenerateError] = useState(null);
  const [allowedGates, setAllowedGates] = useState({ AND: true, OR: true, NOT: true, NAND: true, NAND4: true, NOR: true, XOR: true });

  const [appearance, setAppearance] = useState({ simpleIO: false });

  // --- Coordinate Helper ---
  const getMouseWorldPos = (e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    const svgX = (e.clientX - CTM.e) / CTM.a;
    const svgY = (e.clientY - CTM.f) / CTM.d;
    return {
      x: (svgX - view.x) / view.k,
      y: (svgY - view.y) / view.k
    };
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

  const handleGlobalMouseUp = () => {
    setIsPanning(false);
    setDraggingId(null);
  };

  const addElement = (type, x = 100, y = 100, label = "") => {
    const id = generateId();
    let finalLabel = label;
    if (!label) {
      const count = elements.filter(e => e.type === type).length;
      finalLabel = type === 'INPUT' ? String.fromCharCode(65 + count) : (type === 'OUTPUT' ? 'Y' : '');
    }
    const centerX = (-view.x + 200) / view.k;
    const centerY = (-view.y + 200) / view.k;
    setElements(prev => [...prev, { id, type, x: Math.max(50, centerX), y: Math.max(50, centerY), label: finalLabel }]);
  };

  const updateElementPos = (id, x, y) => { setElements(els => els.map(el => el.id === id ? { ...el, x, y } : el)); };
  const deleteElement = (id) => { setElements(els => els.filter(e => e.id !== id)); setWires(ws => ws.filter(w => w.from !== id && w.to !== id)); };
  const clearCanvas = () => { setElements([]); setWires([]); };

  const handleExport = () => {
    if (!svgRef.current) return;
    const clone = svgRef.current.cloneNode(true);

    const uiElements = clone.querySelectorAll(".no-export");
    uiElements.forEach(el => el.remove());

    const gContent = clone.querySelector(".content-layer");
    if (gContent) {
       gContent.setAttribute("transform", "");
    }

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
      const scale = 3; // 高清导出
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
      URL.revokeObjectURL(url);
    };
    img.onerror = (e) => {
        console.error("Image load failed", e);
        alert("导出失败，请重试");
    };
    img.src = url;
  };

  const copyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (!successful) throw new Error('Copy command failed');
    } catch (err) {
      console.error('Fallback copy failed', err);
      alert("复制失败");
    }
    document.body.removeChild(textArea);
  };

  const handleGeneratePrompt = () => {
    const selectedGates = Object.keys(allowedGates).filter(k => allowedGates[k]).join(', ');
    const prompt = `我正在使用一个逻辑电路生成工具，请帮我将我的逻辑表达式转换为该工具支持的标准格式。
1. **目标格式要求**：
   - 必须显式使用逻辑操作符：AND, OR, NOT, NAND, NOR, XOR, NAND4 (4输入与非门)。
   - 支持括号 () 控制优先级。
   - 支持函数式调用：如 NAND4(A, B, C, D) 或 NAND(A, B)。
   - 格式示例：Y = NAND( (A OR B), C )
2. **硬件约束**：
   - 你只能使用我当前选中的逻辑门：[ ${selectedGates} ]
   - 如果表达式使用了未选中的门，请根据逻辑等价性将其转换为仅使用上述允许的门。
3. **我的原始表达式**：
${expression}
请直接给出转换后的表达式，每行一个，不要包含 Markdown 代码块标记或其他解释文本。`;
    setAiPrompt(prompt);
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
        let exprStr = line;
        if (line.includes('=')) exprStr = line.split('=')[1].trim();
        const tokens = tokenize(exprStr);
        const vars = [...new Set(tokens.filter(t => !['AND','OR','NOT','NAND','NOR','XOR','NAND4','(',')','=',','].includes(t)))];
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
      console.error(e);
    }
  };

  const handleMouseDown = (e, id) => {
    if (connecting) return;
    if (id) {
        e.stopPropagation();
        setDraggingId(id);
    } else {
        startPan(e);
    }
  };

  const handlePortClick = (e, elementId, type, index) => {
    e.stopPropagation();
    if (connecting) {
      if (connecting.elementId === elementId) { setConnecting(null); return; }
      let from = connecting;
      let to = { elementId, portType: type, portIndex: index };
      setWires([...wires, { id: generateId(), from: from.elementId, fromIndex: from.portIndex, to: to.elementId, toIndex: to.portIndex }]);
      setConnecting(null);
    } else { setConnecting({ elementId, portType: type, portIndex: index }); }
  };
  const getPortPos = (elementId, portType, index) => {
    const el = elements.find(e => e.id === elementId);
    if (!el) return { x: 0, y: 0 };
    const config = PORT_CONFIG[el.type];
    const relPos = portType === 'input' ? config.inputs[index] : config.output;
    if (!relPos) return { x: el.x, y: el.y };
    return { x: el.x + relPos.x, y: el.y + relPos.y };
  };

  const renderGate = (el) => {
    if (el.type === 'INPUT') {
      return appearance.simpleIO ? GATE_PATHS.INPUT_SIMPLE : GATE_PATHS.INPUT_STD;
    }
    if (el.type === 'OUTPUT') {
      return appearance.simpleIO ? GATE_PATHS.OUTPUT_SIMPLE : GATE_PATHS.OUTPUT_STD;
    }
    return GATE_PATHS[el.type];
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700" onMouseMove={handleGlobalMouseMove} onMouseUp={handleGlobalMouseUp}>
      {/* Header */}
      <div className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between z-20 shadow-sm relative">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
            <Layout className="text-white w-5 h-5" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              LogicCircuit <span className="text-indigo-600">Gen</span>
            </h1>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mt-0.5">
              <span>v5.3</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="flex items-center gap-1">
                By <a href="https://github.com/budoyh" target="_blank" rel="noreferrer" className="text-slate-700 hover:text-indigo-600 transition-colors">不懂</a>
              </span>
              <a href="https://github.com/budoyh/logic-circuit-designer" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors ml-1" title="View Source">
                <Github size={14} />
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <button
             onClick={() => setShowAppearance(!showAppearance)}
             className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all border text-sm font-medium ${showAppearance ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
           >
             <Eye size={16} />
             <span>外观</span>
           </button>
           {showAppearance && (
             <div className="absolute top-20 right-6 bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/20 ring-1 ring-black/5 w-64 z-50 animate-in fade-in zoom-in-95 origin-top-right">
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                 <Settings size={12}/> 显示设置
               </h4>
               <div
                 className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                 onClick={() => setAppearance(prev => ({ ...prev, simpleIO: !prev.simpleIO }))}
               >
                 <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700 transition-colors">极简节点样式</span>
                 {appearance.simpleIO ? <CheckSquare className="text-indigo-600 w-5 h-5"/> : <Square className="text-slate-300 w-5 h-5 group-hover:text-slate-400"/>}
               </div>
               <p className="text-[10px] text-slate-400 mt-2 px-2 leading-relaxed">
                 开启后，I/O 端口将显示为学术风格的空心圆点，隐藏文字标签背景。
               </p>
             </div>
           )}

           <button
            onClick={() => setShowGenerator(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg font-medium shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all active:translate-y-0 active:shadow-none"
           >
            <Wand2 size={16} />
            <span>智能生成</span>
          </button>
        </div>
      </div>

      {showGenerator && (
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-start justify-center pt-24 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-[800px] flex flex-col max-h-[85vh] overflow-hidden border border-white/20 ring-1 ring-black/5 animate-in slide-in-from-bottom-8 zoom-in-95 duration-300">
            <div className="flex-1 flex flex-col p-0">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-indigo-500"/> 电路生成器
                </h3>
                <button onClick={() => setShowGenerator(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Editor Area */}
                <div className="flex-1 p-6 flex flex-col bg-white">
                  <div className="mb-2 flex justify-between items-center">
                    <label className="text-sm font-semibold text-slate-700">逻辑表达式</label>
                    <button
                      onClick={handleGeneratePrompt}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50 rounded-md transition-colors"
                    >
                      <MessageSquare size={12} />
                      AI 辅助生成
                    </button>
                  </div>
                  <div className="relative flex-1">
                    <textarea
                      value={expression} onChange={(e) => setExpression(e.target.value)}
                      className="w-full h-full p-4 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-mono text-slate-700 leading-relaxed resize-none shadow-inner"
                      placeholder="Y = ABC + A'BD"
                    />
                  </div>
                  {generateError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg flex items-start gap-2 text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{generateError}</span>
                    </div>
                  )}
                </div>

                {/* Settings Sidebar */}
                <div className="w-72 bg-slate-50 border-l border-slate-200 p-6 overflow-y-auto">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Settings size={12}/> 允许使用的逻辑门
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.keys(allowedGates).map(gate => {
                      const labelMap = { NAND: 'NAND (2入)', NAND4: 'NAND (4入)' };
                      return (
                        <label key={gate} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border ${allowedGates[gate] ? 'bg-white border-indigo-200 shadow-sm' : 'border-transparent hover:bg-slate-100'}`}>
                          <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${allowedGates[gate] ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                            <input type="checkbox" checked={allowedGates[gate]} onChange={(e) => setAllowedGates({...allowedGates, [gate]: e.target.checked})} className="hidden"/>
                            {allowedGates[gate] && <CheckSquare size={14} className="text-white" />}
                          </div>
                          <span className={`text-sm font-medium ${allowedGates[gate] ? 'text-indigo-900' : 'text-slate-600'}`}>{labelMap[gate] || gate}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setShowGenerator(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors">取消</button>
              <button onClick={generateFromExpression} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 active:translate-y-0">
                生成电路图
              </button>
            </div>
          </div>
        </div>
      )}

      {showPromptModal && (
        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-[600px] flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-5 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><MessageSquare size={18} className="text-purple-500"/> AI 提示词生成</h3>
                    <button onClick={() => setShowPromptModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <div className="p-6 flex-1 overflow-auto bg-slate-50/50">
                    <p className="text-sm text-slate-500 mb-3">复制以下内容发给 ChatGPT / Claude，获取完美格式：</p>
                    <div className="bg-white border border-slate-200 p-4 rounded-xl text-xs font-mono text-slate-600 whitespace-pre-wrap leading-relaxed shadow-sm">
                        {aiPrompt}
                    </div>
                </div>
                <div className="p-5 border-t border-slate-100 bg-white flex justify-end gap-3">
                     <button onClick={() => setShowPromptModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">关闭</button>
                     <button onClick={() => { copyToClipboard(aiPrompt); setShowPromptModal(false); }} className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2 shadow-md shadow-purple-100 transition-all hover:-translate-y-0.5">
                        <Copy size={16} /> 复制并关闭
                     </button>
                </div>
            </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col p-5 gap-8 overflow-y-auto z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ArrowRightLeft size={12} /> 输入 / 输出
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <PaletteItem type="INPUT" onClick={() => addElement('INPUT')} label="Input" />
              <PaletteItem type="OUTPUT" onClick={() => addElement('OUTPUT')} label="Output" />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Grid size={12} /> 基础逻辑门
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <PaletteItem type="AND" onClick={() => addElement('AND')} />
              <PaletteItem type="OR" onClick={() => addElement('OR')} />
              <PaletteItem type="NOT" onClick={() => addElement('NOT')} />
              <PaletteItem type="NAND" onClick={() => addElement('NAND')} />
              <PaletteItem type="NOR" onClick={() => addElement('NOR')} />
              <PaletteItem type="XOR" onClick={() => addElement('XOR')} />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Cpu size={12} /> 复杂组件
            </h3>
            <div className="grid grid-cols-2 gap-3">
               <PaletteItem type="NAND4" onClick={() => addElement('NAND4')} label="4-In NAND" />
            </div>
          </div>
        </div>

        <div className="flex-1 bg-slate-50/50 relative overflow-hidden cursor-crosshair">
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.15]"
            style={{
              backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`,
              backgroundSize: `${GRID_SIZE * view.k}px ${GRID_SIZE * view.k}px`,
              backgroundPosition: `${view.x}px ${view.y}px`
            }}
          />

          <svg
            ref={svgRef}
            className="w-full h-full"
            onMouseDown={(e) => handleMouseDown(e, null)}
            onWheel={handleWheel}
          >
            <g className="content-layer" transform={`translate(${view.x}, ${view.y}) scale(${view.k})`}>
              {wires.map((wire, idx) => {
                const startPos = getPortPos(wire.from, 'output', null);
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
                  <rect x="-10" y="-10" width={el.type.startsWith('INPUT') || el.type.startsWith('OUTPUT') ? 60 : 90} height={80} fill="transparent" stroke="transparent" />

                  {/* Hover Effect Halo */}
                  <rect x="0" y="0" width={el.type.startsWith('INPUT') ? 40 : 50} height={50} transform="translate(0, 5)" rx="10" fill="transparent" stroke="transparent" className="group-hover:stroke-indigo-300 group-hover:fill-indigo-50/50 transition-all duration-300" strokeWidth="2" strokeDasharray="4"/>

                  <g className="drop-shadow-sm transition-transform duration-200 group-hover:scale-105 origin-center">
                    {renderGate(el)}
                  </g>

                  {el.type === 'INPUT' && (
                    <text x={appearance.simpleIO ? -15 : 0} y={36} textAnchor="end" fontFamily="ui-serif, Georgia, Cambria, serif" fontSize="18px" fontWeight="bold" fill="#1e293b" className="pointer-events-none select-none drop-shadow-sm">{el.label}</text>
                  )}
                  {el.type === 'OUTPUT' && (
                    <text x={appearance.simpleIO ? 35 : 45} y={36} textAnchor="start" fontFamily="ui-serif, Georgia, Cambria, serif" fontSize="18px" fontWeight="bold" fill="#1e293b" className="pointer-events-none select-none drop-shadow-sm">{el.label}</text>
                  )}

                  {/* Delete Button - Improved */}
                  <g className="no-export opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-200 hover:scale-110" onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }} transform="translate(0, -20)">
                    <circle r="10" fill="#fee2e2" stroke="#ef4444" strokeWidth="1" className="shadow-sm"/>
                    <path d="M -3 -3 L 3 3 M 3 -3 L -3 3" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                  </g>

                  {PORT_CONFIG[el.type].inputs.map((pos, idx) => (
                    <circle key={`in-${idx}`} cx={pos.x} cy={pos.y} r={5} fill="transparent" stroke="transparent" className="hover:fill-indigo-500 hover:stroke-indigo-200 hover:stroke-4 cursor-crosshair transition-all" onClick={(e) => handlePortClick(e, el.id, 'input', idx)} />
                  ))}
                  {PORT_CONFIG[el.type].output && (
                    <circle cx={PORT_CONFIG[el.type].output.x} cy={PORT_CONFIG[el.type].output.y} r={5} fill="transparent" stroke="transparent" className="hover:fill-indigo-500 hover:stroke-indigo-200 hover:stroke-4 cursor-crosshair transition-all" onClick={(e) => handlePortClick(e, el.id, 'output', null)} />
                  )}
                </g>
              ))}
            </g>
          </svg>

          {/* Floating Dock (Bottom Tools) */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 ring-1 ring-black/5 z-30 transition-transform hover:scale-105 duration-300">
             <div className="flex items-center gap-1 px-2 border-r border-slate-200/50">
               <button onClick={() => setView(v => ({ ...v, k: Math.max(0.2, v.k - 0.1) }))} className="p-2 hover:bg-white rounded-xl text-slate-500 hover:text-indigo-600 transition-colors"><ZoomOut size={18} /></button>
               <span className="text-xs font-bold text-slate-700 w-12 text-center select-none">{Math.round(view.k * 100)}%</span>
               <button onClick={() => setView(v => ({ ...v, k: Math.min(5, v.k + 0.1) }))} className="p-2 hover:bg-white rounded-xl text-slate-500 hover:text-indigo-600 transition-colors"><ZoomIn size={18} /></button>
             </div>

             <button onClick={() => setView({ x: 0, y: 0, k: 1 })} className="p-2 hover:bg-white rounded-xl text-slate-500 hover:text-indigo-600 transition-colors group relative" title="复位视图">
               <RotateCcw size={18} />
               <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">复位画布</span>
             </button>

             <button onClick={clearCanvas} className="p-2 hover:bg-red-50 rounded-xl text-slate-500 hover:text-red-500 transition-colors group relative" title="清空">
               <Trash2 size={18} />
               <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">清空</span>
             </button>

             <div className="w-px h-6 bg-slate-200/50 mx-1"></div>

             <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-slate-200">
               <Download size={16} />
               <span>导出</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaletteItem({ type, onClick, label }) {
  const iconPath = GATE_PATHS[type] || GATE_PATHS['AND'];
  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center p-3 bg-white border border-slate-100 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 hover:border-indigo-100 active:scale-95"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 rounded-2xl opacity-50 group-hover:opacity-0 transition-opacity"></div>
      <div className="mb-2 scale-75 origin-center text-slate-700 group-hover:text-indigo-600 transition-colors duration-300">
        <svg width="80" height="60" viewBox="0 0 100 80" className="pointer-events-none overflow-visible">
          {iconPath}
        </svg>
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-500 transition-colors">{label || type}</span>
    </div>
  );
}