Logic Circuit Designer (逻辑电路自动生成器)
![GitHub Logo](screenshots/show1.png)
![GitHub Logo](screenshots/show2.png)
![GitHub Logo](screenshots/show3.png)

English Version ↓

Logic Circuit Designer 是一个基于 React 的可视化逻辑电路设计与仿真工具。它专为数字电路实验报告设计，能够将复杂的布尔逻辑表达式瞬间转换为标准、美观、可导出的电路逻辑图。

🎓 特别说明：本项目非常适合用于 郑州大学 (ZZU) 数字电路实验课 的实验报告绘图。生成的图片清晰、规范，且支持“极简学术风格”，完美适配实验报告格式。

✨ 核心功能 (Features)

1. 🚀 智能生成 (Auto-Generation)

多路输入/输出：支持同时生成多个输出方程，例如全加器、译码器。

Sum = (A XOR B) XOR Cin
Cout = (A AND B) OR (Cin AND (A XOR B))


AI 辅助转换：内置 Prompt 生成器，配合 AI (ChatGPT/Claude) 可将任意简写公式（如 Y = AB + C'D）转换为标准格式。

2. 🎨 完美的绘图引擎

智能防重叠布线：采用“通道分流”技术，即使是复杂的跨层级连接，线条也能自动避让组件，清晰不打结。

无限画布：支持鼠标滚轮缩放 (Zoom) 和鼠标拖拽平移 (Pan)，轻松应对超大规模逻辑图。

极简学术风格：一键切换“极简 I/O 模式”，将输入输出简化为各类教材常用的空心圆点风格。

3. 📤 实验报告友好

高清导出：一键导出高分辨率 PNG 图片。

纯净模式：导出时自动移除所有 UI 辅助元素（如删除按钮、网格背景），直接插入 Word 文档即可使用。

🛠️ 使用指南 (User Guide)

输入公式：
在左侧输入框中输入逻辑表达式。支持 AND, OR, NOT, NAND, NOR, XOR, NAND4 等标准门电路。

自定义门电路：
在右侧勾选你允许使用的门电路（例如只允许使用与非门 NAND），系统会根据约束自动综合逻辑。

调整布局：

移动：按住画布空白处拖动。

缩放：使用鼠标滚轮。

微调：可以手动拖拽个别组件微调位置。

导出：
点击右上角的“图片”图标，保存 PNG 文件。

💻 本地运行 (Development)

如果你想在本地运行或修改此项目，请按照以下步骤操作：

环境要求

Node.js (推荐 v16+)

Git

安装步骤

克隆仓库

git clone [https://github.com/你的用户名/logic-circuit-designer.git](https://github.com/你的用户名/logic-circuit-designer.git)
cd logic-circuit-designer


安装依赖

npm install


启动开发服务器

npm run dev


打开浏览器访问 http://localhost:5173 即可。

🛠️ 技术栈 (Tech Stack)

Core: React 18 + Vite

Styling: Tailwind CSS

Graphics: Native SVG + Math-based Routing Algorithms

Icons: Lucide React

🤝 贡献 (Contributing)

欢迎 ZZU 的同学们提交 Issue 或 Pull Request 来改进这个工具！
如果你发现生成的电路图有 Bug，请截图并在 Issue 中反馈。

<a name="logic-circuit-designer-english"></a>

Logic Circuit Designer (English)

Logic Circuit Designer is a React-based visual tool for designing and simulating logic circuits. Specifically designed for Digital Electronics Lab Reports, it instantly converts complex boolean expressions into standard, aesthetic, and exportable logic circuit diagrams.

🎓 Note: This tool is highly recommended for Zhengzhou University (ZZU) students for their Digital Electronics lab reports. It generates clear, standardized diagrams and supports a "Minimalist Academic Style" perfect for reports.

✨ Features

1. 🚀 Intelligent Auto-Generation

Multi-Input/Output Support: Generate circuits for multiple equations simultaneously (e.g., Full Adder, Decoder).

AI-Assisted Conversion: Built-in Prompt Generator allows you to use AI (ChatGPT/Claude) to convert any shorthand formula (like Y = AB + C'D) into the standard format required by the tool.

2. 🎨 Advanced Drawing Engine

Smart Routing: Features "Channel Routing" technology to prevent line overlaps. Even in complex multi-level connections, wires automatically route around components.

Infinite Canvas: Supports Zooming (mouse wheel) and Panning (drag), making it easy to handle large-scale diagrams.

Minimalist Academic Style: Toggle "Simple I/O Mode" to switch inputs/outputs to the hollow circle style commonly used in textbooks.

3. 📤 Report Friendly

HD Export: One-click export to high-resolution PNG images.

Clean Mode: Automatically removes UI elements (like delete buttons, grid background) during export, ready for insertion into Word documents.

🛠️ User Guide

Input Formulas:
Enter your boolean logic expressions in the left panel. Supports standard gates: AND, OR, NOT, NAND, NOR, XOR, NAND4, etc.

Customize Gates:
Select allowed gates on the right panel (e.g., restrict to only NAND gates). The system will automatically synthesize the logic based on your constraints.

Adjust Layout:

Pan: Drag on empty space.

Zoom: Use mouse wheel.

Tweak: Drag individual components to fine-tune positions.

Export:
Click the "Image" icon on the top right to save as PNG.

💻 Local Development

Follow these steps to run the project locally:

Prerequisites

Node.js (v16+ recommended)

Git

Installation

Clone the repository

git clone [https://github.com/your-username/logic-circuit-designer.git](https://github.com/your-username/logic-circuit-designer.git)
cd logic-circuit-designer


Install dependencies

npm install


Start development server

npm run dev


Open your browser and visit http://localhost:5173.

🤝 Contributing

Contributions, issues, and feature requests are welcome!
If you find a bug in the generated circuit, please take a screenshot and file an issue.

Created with ❤️ for Digital Electronics.