import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ⚠️ 注意：这里必须填你的仓库名，前后都要有斜杠
  base: '/logic-circuit-designer/',
})