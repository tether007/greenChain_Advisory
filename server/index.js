import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:7545';
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY || '0x18e4eaee6a2a83c2b0d24ac8564f1233440b92fd96e02a80389cfe7d6edff493';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || process.env.VITE_CONTRACT_ADDRESS || '';

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Initialize AI providers
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Initialize PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'crop_advisor',
  password: process.env.DB_PASSWORD || '1234',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Create analyses table if it doesn't exist
const initDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analyses (
        id SERIAL PRIMARY KEY,
        analysis_id VARCHAR(255) UNIQUE NOT NULL,
        farmer_address VARCHAR(255) NOT NULL,
        image_hash VARCHAR(255) NOT NULL,
        diagnosis TEXT,
        advice TEXT,
        confidence DECIMAL(3,2),
        severity VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
};

// Initialize database on startup
initDatabase();

// Helper: get ethers provider/wallet/contract
const getProvider = () => new ethers.providers.JsonRpcProvider(RPC_URL);
const getWallet = () => {
  if (!RELAYER_PRIVATE_KEY) throw new Error('RELAYER_PRIVATE_KEY is not set');
  return new ethers.Wallet(RELAYER_PRIVATE_KEY, getProvider());
};
const getContractAbi = () => {
  try {
    const abiJson = fs.readFileSync(path.resolve(__dirname, '../build/contracts/CropAdvisor.json'), 'utf-8');
    const parsed = JSON.parse(abiJson);
    return parsed.abi;
  } catch (e) {
    throw new Error('Failed to load contract ABI from build/contracts/CropAdvisor.json');
  }
};
const getContract = () => {
  if (!CONTRACT_ADDRESS) throw new Error('CONTRACT_ADDRESS is not configured');
  return new ethers.Contract(CONTRACT_ADDRESS, getContractAbi(), getWallet());
};

// API Routes
// Generic relay endpoint for gasless tx submission
app.post('/api/relay', async (req, res) => {
  try {
    const { to, data, value } = req.body || {};
    if (!to || !data) {
      return res.status(400).json({ error: 'to and data are required' });
    }
    const wallet = getWallet();
    const tx = await wallet.sendTransaction({ to, data, value: value ? ethers.BigNumber.from(value) : undefined });
    const receipt = await tx.wait();
    return res.json({ hash: tx.hash, status: receipt.status });
  } catch (error) {
    console.error('Relay failed:', error);
    return res.status(500).json({ error: 'Relay failed' });
  }
});
app.post('/api/analyses', async (req, res) => {
  try {
    const { analysisId, farmerAddress, imageHash } = req.body;

    if (!analysisId || !farmerAddress || !imageHash) {
      return res.status(400).json({ error: 'analysisId, farmerAddress, imageHash are required' });
    }

    await pool.query(
      `INSERT INTO analyses (analysis_id, farmer_address, image_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (analysis_id) DO NOTHING`,
      [analysisId, farmerAddress, imageHash]
    );

    return res.json({ ok: true });
  } catch (error) {
    console.error('Failed to create analysis record:', error);
    return res.status(500).json({ error: 'Failed to create analysis record' });
  }
});

app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    const { analysisId } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!analysisId) {
      return res.status(400).json({ error: 'Analysis ID is required' });
    }

    // Read and encode image
    const imageData = fs.readFileSync(imageFile.path);
    const base64Image = imageData.toString('base64');


    const prompt = `
      You are an expert agri-pathologist and crop advisor. Analyze the attached image.

      Goals:
      1) Identify the plant species and specific leaf (e.g., tomato leaf, grapevine leaf). Return best guess with confidence.
      2) Detect likely disease/pest/nutrient issue(s). Include differentials with confidence and severity.
      3) Provide clear, actionable recommendations separated into:
         - Medicine/Treatment Plan (active ingredients, doses, application intervals, safety notes)
         - Cultural/Technical Practices (irrigation, pruning, sanitation, spacing, crop rotation)
         - Monitoring & Prevention (scouting, thresholds, IPM)
         - Timeline (Day 0, Day 3–5, Week 2, Week 4)
      4) Include when to seek lab testing and which tests.

      Output strictly as compact JSON (no markdown) with this schema:
      {
        "plant": {
          "species": "string",
          "leafType": "string",
          "confidence": 0.0
        },
        "diagnosis": "string",
        "differentials": [ { "name": "string", "confidence": 0.0 } ],
        "severity": "low|medium|high",
        "confidence": 0.0,
        "medicinePlan": [ { "name": "string", "dose": "string", "interval": "string", "notes": "string" } ],
        "culturalPractices": [ "string", "string" ],
        "monitoring": [ "string", "string" ],
        "timeline": [ { "when": "Day 0", "actions": ["string"] }, { "when": "Day 3-5", "actions": ["string"] } ],
        "labTests": [ "PCR for virus X", "Soil test NPK", "Microscopy for fungal spores" ]
      }

      Be concise but specific. Prefer globally available actives over brand names where possible.
    `;

    let text = '';
    if (openai) {
      const resp = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a concise expert crop pathologist producing strict JSON.' },
          { role: 'user', content: `${prompt}\n\nHere is the image as a data URI: data:${imageFile.mimetype};base64,${base64Image}` },
        ],
        temperature: 0.3,
        max_tokens: 800,
      });
      text = resp.choices?.[0]?.message?.content || '';
    } else {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const imagePart = { inlineData: { data: base64Image, mimeType: imageFile.mimetype } };
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      text = response.text();
    }

    // Parse the AI response
    let analysisResult;
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response');
      }
    } catch (parseError) {
      // Fallback parsing if JSON extraction fails
      analysisResult = {
        diagnosis: text.substring(0, 200) + '...',
        advice: 'Please consult with a local agricultural expert for detailed treatment recommendations.',
        severity: 'medium',
        confidence: 0.75
      };
    }

    // Store in database
    await pool.query(
      `UPDATE analyses 
       SET diagnosis = $1, advice = $2, confidence = $3, severity = $4, completed_at = NOW()
       WHERE analysis_id = $5`,
      [
        analysisResult.diagnosis,
        analysisResult.advice,
        analysisResult.confidence,
        analysisResult.severity,
        analysisId
      ]
    );

    // Generate PDF summary
    const reportFile = path.join(__dirname, `reports_${Date.now()}_${analysisId}.pdf`);
    await new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 48 });
        const stream = fs.createWriteStream(reportFile);
        doc.pipe(stream);
        doc.fontSize(18).text('CropAdvisor AI Report', { align: 'center' });
        doc.moveDown();
        // Insert image
        try {
          const imgPath = imageFile.path;
          doc.image(imgPath, { fit: [500, 300], align: 'center' });
          doc.moveDown();
        } catch {}
        doc.fontSize(12).text(`Analysis ID: ${analysisId}`);
        doc.text(`Plant: ${analysisResult?.plant?.species || 'Unknown'} (${analysisResult?.plant?.leafType || 'Leaf'}) | Confidence: ${analysisResult?.plant?.confidence ?? 'n/a'}`);
        doc.moveDown();
        doc.fontSize(14).text('Diagnosis');
        doc.fontSize(12).text(analysisResult.diagnosis || 'N/A');
        doc.moveDown();
        doc.fontSize(14).text('Severity & Confidence');
        doc.fontSize(12).text(`Severity: ${analysisResult.severity} | Confidence: ${analysisResult.confidence}`);
        doc.moveDown();
        if (analysisResult.differentials?.length) {
          doc.fontSize(14).text('Differentials');
          analysisResult.differentials.forEach((d) => doc.fontSize(12).text(`- ${d.name} (conf: ${d.confidence})`));
          doc.moveDown();
        }
        if (analysisResult.medicinePlan?.length) {
          doc.fontSize(14).text('Medicine / Treatment Plan');
          analysisResult.medicinePlan.forEach((m) => doc.fontSize(12).text(`- ${m.name} | Dose: ${m.dose} | Interval: ${m.interval} | Notes: ${m.notes}`));
          doc.moveDown();
        }
        if (analysisResult.culturalPractices?.length) {
          doc.fontSize(14).text('Cultural / Technical Practices');
          analysisResult.culturalPractices.forEach((c) => doc.fontSize(12).text(`- ${c}`));
          doc.moveDown();
        }
        if (analysisResult.monitoring?.length) {
          doc.fontSize(14).text('Monitoring & Prevention');
          analysisResult.monitoring.forEach((m) => doc.fontSize(12).text(`- ${m}`));
          doc.moveDown();
        }
        if (analysisResult.timeline?.length) {
          doc.fontSize(14).text('Timeline');
          analysisResult.timeline.forEach((t) => {
            doc.fontSize(12).text(`${t.when}:`);
            (t.actions || []).forEach((a) => doc.text(`  - ${a}`));
          });
          doc.moveDown();
        }
        if (analysisResult.labTests?.length) {
          doc.fontSize(14).text('Recommended Lab Tests');
          analysisResult.labTests.forEach((l) => doc.fontSize(12).text(`- ${l}`));
          doc.moveDown();
        }
        doc.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
      } catch (e) {
        reject(e);
      }
    });

    // Clean up uploaded file after PDF generation
    try {
      fs.unlinkSync(imageFile.path);
    } catch {}

    // Also finalize on-chain via relayer (gasless for user)
    try {
      const contract = getContract();
      // Skip if already completed to avoid revert
      const current = await contract.getAnalysis(ethers.BigNumber.from(analysisId));
      if (!current.completed) {
        const tx = await contract.completeAnalysis(
          ethers.BigNumber.from(analysisId),
          String(analysisResult.diagnosis),
          String(analysisResult.advice),
          { gasLimit: 300000 }
        );
        await tx.wait();
      }
    } catch (chainErr) {
      console.error('On-chain completion failed:', chainErr);
      // Continue returning analysis result even if chain update fails
    }

    res.json({ ...analysisResult, report: path.basename(reportFile) });

  } catch (error) {
    console.error('Analysis failed:', error);
    
    // Clean up file if it exists
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('File cleanup failed:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      error: 'Analysis failed. Please try again later.' 
    });
  }
});

// Get analysis history for a farmer
app.get('/api/analyses/:farmerAddress', async (req, res) => {
  try {
    const { farmerAddress } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM analyses WHERE farmer_address = $1 ORDER BY created_at DESC',
      [farmerAddress]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch analyses:', error);
    res.status(500).json({ error: 'Failed to fetch analysis history' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve generated PDF reports
app.get('/api/reports/:file', (req, res) => {
  const filename = req.params.file;
  const reportPath = path.join(__dirname, filename);
  if (!fs.existsSync(reportPath)) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.setHeader('Content-Type', 'application/pdf');
  fs.createReadStream(reportPath).pipe(res);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});