import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const solde = formData.get('solde')
    const horizon = formData.get('horizon')
    const decouvert = formData.get('decouvert')

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'Fichier CSV manquant.' }, { status: 400 })
    }

    if (!solde) {
      return NextResponse.json({ success: false, error: 'Solde manquant.' }, { status: 400 })
    }

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bank-analysis-'))
    const csvPath = path.join(tempDir, file.name)
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(csvPath, buffer)

    const scriptPath = path.join(process.cwd(), 'analyse_banque.py')
    const horizonValue = typeof horizon === 'string' && horizon ? horizon : '30'
    const decouvertValue = typeof decouvert === 'string' && decouvert ? decouvert : '-200'

    const { stdout, stderr } = await execFileAsync('python3', [
      scriptPath,
      '--input',
      csvPath,
      '--solde',
      String(solde),
      '--horizon',
      String(horizonValue),
      '--decouvert',
      String(decouvertValue),
    ], {
      cwd: tempDir,
      timeout: 120000,
    })

    const forecastFileName = `previsionnel_${horizonValue}j.csv`
    const outputs = {
      operations: await fs.readFile(path.join(tempDir, 'operations_enrichies.csv')),
      recurrents: await fs.readFile(path.join(tempDir, 'recurrents_detectes.csv')),
      forecast: await fs.readFile(path.join(tempDir, forecastFileName)),
    }

    const data = {
      operations: outputs.operations.toString('base64'),
      recurrents: outputs.recurrents.toString('base64'),
      forecast: outputs.forecast.toString('base64'),
      console: `${stdout}\n${stderr}`.trim(),
      forecastFileName,
    }

    await fs.rm(tempDir, { recursive: true, force: true })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Erreur analyse bancaire:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'analyse bancaire.' },
      { status: 500 }
    )
  }
}
