import React, { useState, useRef, useEffect } from 'react';
import { Trash2, RotateCcw, Download, FolderOpen, Wand2, X, HelpCircle, Layout, Settings, Image as ImageIcon, AlertTriangle, ArrowRightLeft, MessageSquare, Eye, CheckSquare, Square, Copy, ZoomIn, ZoomOut, Move } from 'lucide-react';

/**
 * 逻辑电路设计器 v5.0 (Zoom & Clean Export)
 * 更新内容：
 * 1. 画布缩放与平移 (Infinite Canvas): 支持鼠标滚轮缩放，按住空白处拖拽平移。
 * 2. 导出修复 (Clean Export): 导出时强制移除删除按钮 (.no-export)，解决红叉残留问题。
 * 3. 坐标系重构: 鼠标交互逻辑适配缩放矩阵 (World Coordinates)。
 */

// --- 基础配置 ---
const GRID_SIZE = 20;
const WIRE_COLOR = "black";
const WIRE_WIDTH = 2;
const GATE_STROKE_WIDTH = 2;
const LEVEL_WIDTH = 200;
const MIN_NODE_GAP = 120;
const INPUT_ROW_HEIGHT = 90;

// --- 组件定义 (SVG Paths) ---
const SHAPES = {
  AND: (
    <path d="M 10 5 L 10 55 L 35 55 A 25 25 0 0 0 35 5 L 10 5 Z" fill="white" stroke="black" strokeWidth={GATE_STROKE_WIDTH} />
  ),
  OR: (
    <path d="M 10 5 C 10 5 22 18 22 30 C 22 42 10 55 10 55 C 40 55 60 42 60 30 C 60 18 40 5 10 5 Z" fill="white" stroke="black" strokeWidth={GATE_STROKE_WIDTH} />
  ),
  NOT: (
    <g>
      <path d="M 10 10 L 10 50 L 50 30 Z" fill="white" stroke="black" strokeWidth={GATE_STROKE_WIDTH} />
      <circle cx="56" cy="30" r="4" fill="white" stroke="black" strokeWidth={GATE_STROKE_WIDTH} />
    </g>
  ),
  NAND: (
    <g>
       <path d="M 10 5 L 10 55 L 35 55 A 25 25 0 0 0 35 5 L 10 5 Z" fill="white" stroke="black" strokeWidth={GATE_STROKE_WIDTH} />
      <circle cx="66" cy="30" r="4" fill="white" stroke="black" strokeWidth={GATE_STROKE_WIDTH} />
    </g>
  ),
  NOR: (
    <g>
      <path d="M 10 5 C 10 5 22 18 22 30 C 22 42 10 55 10 55 C 40 55 60 42 60 30 C 60 18 40 5 10 5 Z" fill="white" stroke="black" strokeWidth={GATE_STROKE_WIDTH} />
      <circle cx="66" cy="30" r="4" fill="white" stroke="black" strokeWidth={GATE_STROKE_WIDTH} />
    </g>
  ),
  XOR: (
    <g>
      <path d="M 0 5 C 0 5 12 18 12 30 C 12 42 0 55 0 55" fill="none" stroke="black" strokeWidth={GATE_STROKE_WIDTH} />
      <path d="M 18 5 C 18 5 30 18 30 30 C 30 42 18 55 18 55 C 48 55 68 42 68 30 C 68 18 48 5 18 5 Z" fill="white" stroke="black" strokeWidth={GATE_STROKE_WIDTH} />
    </g>
  ),
  NAND4: (
    <g>
      <path d="M 10 0 L 10 80 L 35 80 A 40 40 0 0 0 35 0 L 10 0 Z" fill="white" stroke="black" strokeWidth={GATE_STROKE_WIDTH} />
      <circle cx="81" cy="40" r="4" fill="white" stroke="black" strokeWidth={GATE_STROKE_WIDTH} />
    </g>
  ),
  INPUT_STD: (
    <g>
      <rect x="0" y="15" width="40" height="30" rx="4" fill="white" stroke="black" strokeWidth={2} />
      <text x="20" y="36" textAnchor="middle" fontFamily="monospace" fontSize="16" fontWeight="bold">IN</text>
    </g>
  ),
  OUTPUT_STD: (
    <g>
      <circle cx="20" cy="30" r="15" fill="white" stroke="black" strokeWidth={2} />
      <text x="20" y="35" textAnchor="middle" fontFamily="monospace" fontSize="14" fontWeight="bold">Y</text>
    </g>
  ),
  INPUT_SIMPLE: (
    <circle cx="25" cy="30" r="6" fill="transparent" stroke="black" strokeWidth={2} />
  ),
  OUTPUT_SIMPLE: (
    <circle cx="20" cy="30" r="6" fill="transparent" stroke="black" strokeWidth={2} />
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

const tokenize = (expr) => expr.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ').replace(/=/g, ' = ').toUpperCase().trim().split(/\s+/);

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
    if (token === 'NOT') { this.consume(); return { type: 'NOT', children: [this.parseFactor()] }; }
    else if (token === '(') {
      this.consume();
      const expr = this.parseExpression();
      if (this.peek() === ')') this.consume();
      return expr;
    } else return { type: 'VAR', value: this.consume() };
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
  const [showGenerator, setShowGenerator] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  // --- View State (Zoom & Pan) ---
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [expression, setExpression] = useState("Y = ABC + A'BD");
  const svgRef = useRef(null);
  const [generateError, setGenerateError] = useState(null);
  const [allowedGates, setAllowedGates] = useState({ AND: true, OR: true, NOT: true, NAND: true, NAND4: false, NOR: true, XOR: true });

  const [appearance, setAppearance] = useState({ simpleIO: false });

  // --- Coordinate Helper ---
  // 将屏幕坐标转换为画布（世界）坐标
  const getMouseWorldPos = (e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    // 基础 SVG 坐标
    const svgX = (e.clientX - CTM.e) / CTM.a;
    const svgY = (e.clientY - CTM.f) / CTM.d;
    // 应用平移和缩放逆变换
    return {
      x: (svgX - view.x) / view.k,
      y: (svgY - view.y) / view.k
    };
  };

  // --- Zoom & Pan Handlers ---
  const handleWheel = (e) => {
    e.preventDefault(); // 防止页面滚动
    const zoomIntensity = 0.1;
    const wheel = e.deltaY < 0 ? 1 : -1;
    let newK = view.k + wheel * zoomIntensity;
    newK = Math.max(0.2, Math.min(newK, 5)); // 限制缩放范围 0.2x - 5x

    // 简单居中缩放逻辑：这里先简单实现基于左上角或当前位置的缩放
    // 为了更好的体验，通常需要基于鼠标位置缩放，但从中心缩放比较稳健
    setView(prev => ({ ...prev, k: newK }));
  };

  const startPan = (e) => {
    // 只有当点击的是 SVG 背景（而非组件）时才平移
    // 如果已经选中了 draggingId，则不平移
    if (draggingId !== null || connecting !== null) return;

    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handleGlobalMouseMove = (e) => {
    // 处理平移
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setView(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // 处理组件拖拽
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

  // --- Operation Wrappers ---
  const addElement = (type, x = 100, y = 100, label = "") => {
    const id = generateId();
    let finalLabel = label;
    if (!label) {
      const count = elements.filter(e => e.type === type).length;
      finalLabel = type === 'INPUT' ? String.fromCharCode(65 + count) : (type === 'OUTPUT' ? 'Y' : '');
    }
    // 添加到当前视图中心附近
    const centerX = (-view.x + 100) / view.k;
    const centerY = (-view.y + 100) / view.k;
    setElements(prev => [...prev, { id, type, x: Math.max(0, centerX), y: Math.max(0, centerY), label: finalLabel }]);
  };

  const updateElementPos = (id, x, y) => { setElements(els => els.map(el => el.id === id ? { ...el, x, y } : el)); };
  const deleteElement = (id) => { setElements(els => els.filter(e => e.id !== id)); setWires(ws => ws.filter(w => w.from !== id && w.to !== id)); };
  const clearCanvas = () => { setElements([]); setWires([]); };

  // --- Clean Export Fix ---
  const handleExport = () => {
    if (!svgRef.current) return;
    const clone = svgRef.current.cloneNode(true);

    // 1. 移除 UI 辅助元素 (带有 no-export 类的元素)
    const uiElements = clone.querySelectorAll(".no-export");
    uiElements.forEach(el => el.remove());

    // 2. 移除 transform，让导出的图片显示完整内容，而不是当前视口
    // 或者我们保留 transform? 不，通常导出希望是“全图”。
    // 我们需要计算内容的边界盒子 (Bounding Box)
    // 简单起见，我们重置 ViewBox 到内容大小
    const gContent = clone.querySelector(".content-layer");
    if (gContent) {
       // 移除缩放和平移，恢复原始比例
       gContent.setAttribute("transform", "");
    }

    // 计算包围盒 (简单估算)
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elements.forEach(el => {
       if (el.x < minX) minX = el.x;
       if (el.y < minY) minY = el.y;
       if (el.x > maxX) maxX = el.x;
       if (el.y > maxY) maxY = el.y;
    });
    // 增加一些 padding
    const padding = 100;
    const width = (maxX - minX) + padding * 2 || 800;
    const height = (maxY - minY) + padding * 2 || 600;
    const viewBoxX = (minX - padding) || 0;
    const viewBoxY = (minY - padding) || 0;

    clone.setAttribute('width', width);
    clone.setAttribute('height', height);
    clone.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${width} ${height}`);
    clone.style.backgroundColor = "#F9FAFB";

    const svgData = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = "#F9FAFB";
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

  // ... (Prompt generation and synthesis logic remains the same) ...
  const handleGeneratePrompt = () => {
    const selectedGates = Object.keys(allowedGates).filter(k => allowedGates[k]).join(', ');
    const prompt = `我正在使用一个逻辑电路生成工具，请帮我将我的逻辑表达式转换为该工具支持的标准格式。
1. **目标格式要求**：
   - 必须显式使用逻辑操作符：AND, OR, NOT, NAND, NOR, XOR, NAND4 (4输入与非门)。
   - 支持括号 () 控制优先级。
   - 格式示例：Y = (A AND B) OR (NOT C)
   - 对于 SOP 简写 (如 AB + C'D)，请展开为：(A AND B) OR ((NOT C) AND D)。
2. **硬件约束**：
   - 你只能使用我当前选中的逻辑门：[ ${selectedGates} ]
   - 如果表达式使用了未选中的门，请根据逻辑等价性（如德摩根定律）将其转换为仅使用上述允许的门。
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
        const vars = [...new Set(tokens.filter(t => !['AND','OR','NOT','NAND','NOR','XOR','(',')','='].includes(t)))];
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
        e.stopPropagation(); // 阻止背景平移
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
    <div className="flex flex-col h-screen bg-gray-50 text-slate-800 font-sans" onMouseMove={handleGlobalMouseMove} onMouseUp={handleGlobalMouseUp}>
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg"><Layout className="text-white w-5 h-5" /></div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">LogicCircuit Gen 5.0</h1>
            <p className="text-xs text-gray-500">无限画布与高清导出</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Zoom Controls */}
           <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 border border-gray-200">
              <button onClick={() => setView(v => ({ ...v, k: Math.max(0.2, v.k - 0.2) }))} className="p-1.5 hover:bg-white rounded text-gray-600"><ZoomOut size={16} /></button>
              <span className="text-xs font-mono w-12 text-center">{Math.round(view.k * 100)}%</span>
              <button onClick={() => setView(v => ({ ...v, k: Math.min(5, v.k + 0.2) }))} className="p-1.5 hover:bg-white rounded text-gray-600"><ZoomIn size={16} /></button>
              <button onClick={() => setView({ x: 0, y: 0, k: 1 })} className="p-1.5 hover:bg-white rounded text-gray-600 border-l ml-1 border-gray-200" title="复位"><RotateCcw size={14} /></button>
           </div>

           <div className="h-6 w-px bg-gray-300 mx-2"></div>

           <div className="relative">
             <button
               onClick={() => setShowAppearance(!showAppearance)}
               className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors border font-medium ${showAppearance ? 'bg-gray-100 text-gray-900 border-gray-300' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
               title="外观设置"
             >
               <Eye size={18} />
             </button>
             {showAppearance && (
               <div className="absolute top-12 right-0 bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-64 z-50 animate-in fade-in zoom-in-95">
                 <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                   <Settings size={14}/> 显示选项
                 </h4>
                 <div
                   className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                   onClick={() => setAppearance(prev => ({ ...prev, simpleIO: !prev.simpleIO }))}
                 >
                   <span className="text-sm text-gray-700">极简输入输出</span>
                   {appearance.simpleIO ? <CheckSquare className="text-indigo-600 w-5 h-5"/> : <Square className="text-gray-400 w-5 h-5"/>}
                 </div>
               </div>
             )}
           </div>

           <button onClick={() => setShowGenerator(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg border border-indigo-200 font-medium transition-colors">
            <Wand2 size={18} /> 智能生成
          </button>
           <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
            <ImageIcon size={18} /> 导出图片
          </button>
          <button onClick={clearCanvas} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors">
            <Trash2 size={18} /> 清空
          </button>
        </div>
      </div>

      {showGenerator && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-white p-6 rounded-xl shadow-xl border border-gray-200 z-50 w-[820px] animate-in fade-in slide-in-from-top-4 flex gap-6 max-h-[80vh] overflow-hidden">
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-indigo-500"/> 电路生成器
              </h3>
            </div>
            <div className="mb-4 flex-1 flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-2">逻辑表达式</label>
              <textarea
                value={expression} onChange={(e) => setExpression(e.target.value)}
                className="w-full flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm shadow-sm leading-relaxed min-h-[200px] resize-none"
                placeholder="Y = ABC + A'BD"
              />
              <div className="flex items-center justify-between mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                <div className="text-xs text-gray-500">遇到复杂的简写公式？让 AI 帮你转换格式。</div>
                <button
                  onClick={handleGeneratePrompt}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded hover:bg-purple-200 transition-colors"
                >
                  <MessageSquare size={12} />
                  生成 AI 提示词
                </button>
              </div>
            </div>
            {generateError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{generateError}</span>
              </div>
            )}
          </div>
          <div className="w-72 border-l border-gray-100 pl-6 flex flex-col overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2"><Settings size={14}/> 允许使用的逻辑门</h4>
              <button onClick={() => setShowGenerator(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-2 mb-6">
              {Object.keys(allowedGates).map(gate => {
                const labelMap = { NAND: 'NAND (2入)', NAND4: 'NAND (4入)' };
                return (
                  <label key={gate} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input type="checkbox" checked={allowedGates[gate]} onChange={(e) => setAllowedGates({...allowedGates, [gate]: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"/>
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{labelMap[gate] || gate}</span>
                  </label>
                );
              })}
            </div>
            <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-gray-100">
              <button onClick={generateFromExpression} className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm text-sm">生成电路</button>
              <button onClick={() => setShowGenerator(false)} className="w-full py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm">取消</button>
            </div>
          </div>
        </div>
      )}

      {showPromptModal && (
        <div className="absolute inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-[600px] flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-bold text-gray-800">AI 提示词生成</h3>
                    <button onClick={() => setShowPromptModal(false)}><X size={20} className="text-gray-500" /></button>
                </div>
                <div className="p-4 flex-1 overflow-auto bg-gray-50">
                    <p className="text-sm text-gray-600 mb-2">复制以下内容发给 ChatGPT / Claude / Gemini，让它帮你生成完美的电路公式：</p>
                    <div className="bg-white border p-3 rounded text-sm font-mono text-gray-700 whitespace-pre-wrap selection:bg-purple-100">
                        {aiPrompt}
                    </div>
                </div>
                <div className="p-4 border-t flex justify-end gap-2">
                     <button onClick={() => setShowPromptModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">关闭</button>
                     <button onClick={() => { copyToClipboard(aiPrompt); setShowPromptModal(false); }} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2">
                        <Copy size={16} /> 复制并关闭
                     </button>
                </div>
            </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col p-4 gap-6 overflow-y-auto z-10 shadow-lg">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">I/O 端口</h3>
            <div className="grid grid-cols-2 gap-3">
              <PaletteItem type="INPUT" onClick={() => addElement('INPUT')} />
              <PaletteItem type="OUTPUT" onClick={() => addElement('OUTPUT')} />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">标准逻辑门 (2输入)</h3>
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
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">扩展逻辑门 (4输入)</h3>
            <div className="grid grid-cols-2 gap-3">
               <PaletteItem type="NAND4" onClick={() => addElement('NAND4')} label="4-In NAND" />
            </div>
          </div>
        </div>

        <div className="flex-1 bg-gray-50 relative overflow-hidden cursor-crosshair">
          {/* Infinite Grid Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
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
                    <path d={getManhattanPath(startPos.x, startPos.y, endPos.x, endPos.y, idx)} stroke={WIRE_COLOR} strokeWidth={WIRE_WIDTH} fill="none" />
                    <circle cx={startPos.x} cy={startPos.y} r={3} fill="black" />
                    <circle cx={endPos.x} cy={endPos.y} r={3} fill="black" />
                  </g>
                );
              })}
              {connecting && (
                <path d={getManhattanPath(getPortPos(connecting.elementId, connecting.portType, connecting.portIndex).x, getPortPos(connecting.elementId, connecting.portType, connecting.portIndex).y, (mousePos.x - view.x)/view.k, (mousePos.y - view.y)/view.k)} stroke="blue" strokeWidth={2} strokeDasharray="4 4" fill="none" pointerEvents="none" />
              )}
              {elements.map(el => (
                <g key={el.id} transform={`translate(${el.x},${el.y})`} onMouseDown={(e) => handleMouseDown(e, el.id)} className="cursor-move select-none group">
                  <rect x="-10" y="-10" width={el.type.startsWith('INPUT') || el.type.startsWith('OUTPUT') ? 60 : 90} height={80} fill="transparent" stroke="transparent" className="group-hover:stroke-blue-200" strokeDasharray="4" />

                  {renderGate(el)}

                  {el.type === 'INPUT' && (
                    <text x={appearance.simpleIO ? -15 : 0} y={36} textAnchor="end" fontFamily="serif" fontSize="18px" fontWeight="bold" fill="black" className="pointer-events-none select-none">{el.label}</text>
                  )}
                  {el.type === 'OUTPUT' && (
                    <text x={appearance.simpleIO ? 35 : 45} y={36} textAnchor="start" fontFamily="serif" fontSize="18px" fontWeight="bold" fill="black" className="pointer-events-none select-none">{el.label}</text>
                  )}

                  {/* Delete Button: Marked with 'no-export' class */}
                  <g className="no-export opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity" onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }} transform="translate(0, -15)">
                    <circle r="8" fill="#fee2e2" stroke="#ef4444" />
                    <path d="M -3 -3 L 3 3 M 3 -3 L -3 3" stroke="#ef4444" strokeWidth="2" />
                  </g>

                  {PORT_CONFIG[el.type].inputs.map((pos, idx) => (
                    <circle key={`in-${idx}`} cx={pos.x} cy={pos.y} r={4} fill={connecting && connecting.portType === 'output' ? '#3b82f6' : 'white'} stroke="black" strokeWidth={1} className="hover:fill-blue-500 cursor-pointer" onClick={(e) => handlePortClick(e, el.id, 'input', idx)} />
                  ))}
                  {PORT_CONFIG[el.type].output && (
                    <circle cx={PORT_CONFIG[el.type].output.x} cy={PORT_CONFIG[el.type].output.y} r={4} fill={connecting && connecting.portType === 'input' ? '#3b82f6' : 'white'} stroke="black" strokeWidth={1} className="hover:fill-blue-500 cursor-pointer" onClick={(e) => handlePortClick(e, el.id, 'output', null)} />
                  )}
                </g>
              ))}
            </g>
          </svg>

          {/* Zoom Indicator */}
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-gray-200 text-xs font-mono text-gray-500 pointer-events-none">
             Scale: {Math.round(view.k * 100)}% | Pos: {Math.round(view.x)},{Math.round(view.y)}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaletteItem({ type, onClick, label }) {
  const iconPath = GATE_PATHS[type] || GATE_PATHS['AND'];
  return (
    <div onClick={onClick} className="flex flex-col items-center justify-center p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md cursor-pointer transition-all active:scale-95 h-20 relative">
      <div className="mb-1 scale-[0.65] origin-center"><svg width="90" height="80" viewBox="0 0 100 80" className="pointer-events-none">{iconPath}</svg></div>
      <span className="text-[10px] font-medium text-gray-600 absolute bottom-1">{label || type}</span>
    </div>
  );
}