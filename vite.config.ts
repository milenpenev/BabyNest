import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { spawn } from 'node:child_process'

function doctorReportApi() {
  const handler = (req: any, res: any) => {
    if (req.url !== '/api/doctor-report' || req.method !== 'POST') return false
    let body = ''
    req.on('data', (chunk: Buffer) => { body += chunk.toString() })
    req.on('end', () => {
      const process = spawn(path.resolve(__dirname, '.venv/bin/python'), [path.resolve(__dirname, 'src/features/doctor-report/pdf/generate_doctor_report.py')])
      const output: Buffer[] = []; const errors: Buffer[] = []
      process.stdout.on('data', (chunk: Buffer) => output.push(chunk)); process.stderr.on('data', (chunk: Buffer) => errors.push(chunk))
      process.on('close', (code) => { if (code !== 0) { res.statusCode=500;res.end(Buffer.concat(errors).toString());return } res.setHeader('Content-Type','application/pdf');res.end(Buffer.concat(output)) })
      process.stdin.end(body)
    })
    return true
  }
  return { name:'doctor-report-api',configureServer(server:any){server.middlewares.use((req:any,res:any,next:any)=>{if(!handler(req,res))next()})},configurePreviewServer(server:any){server.middlewares.use((req:any,res:any,next:any)=>{if(!handler(req,res))next()})} }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), doctorReportApi()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
