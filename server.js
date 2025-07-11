import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import * as fsSync from 'fs';
import multer from 'multer';
import sharp from 'sharp';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Ensure upload directories exist (images, video, optimized)
['images','video','images/optimized'].forEach((d)=>{
  try {
    fsSync.mkdirSync(path.join(__dirname, d), { recursive: true });
  } catch {
    /* ignore */
  }
});

const app  = express();
const PORT = process.env.PORT || 3000;
const TOKEN= process.env.ADMIN_TOKEN || 'TOKEN';

// paths
const PUBLIC_DIR = __dirname; // serve existing project root
const ADMIN_DIR  = path.join(__dirname,'admin');
const DATA_FILE  = path.join(__dirname,'data','galleries.json');
const SITE_FILE  = path.join(__dirname,'data','site.json');
const SHADER_FILE = path.join(__dirname,'data','mobile_shader.glsl');

// middleware
app.use(cors());
app.use(express.json({limit:'2mb'}));
app.use(express.text({type:'text/plain',limit:'200kb'}));

// static
app.use('/',      express.static(PUBLIC_DIR));
app.use('/admin', express.static(ADMIN_DIR));

// upload storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isVideo = file.mimetype.startsWith('video');
    const dir = isVideo ? 'video' : 'images';
    cb(null, path.join(__dirname, dir));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g,'');
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// ---- Config immagini ottimizzate ----
const SIZES = { small: 400, medium: 800, large: 1200, xlarge: 1920 };
const QUALITY = { jpeg: 80, webp: 85, avif: 60 };

// Helper per generare immagine se non esiste
async function ensureOptimized(nameWithExt, size, format) {
  const baseName = path.parse(nameWithExt).name; // senza estensione
  const inputPath = path.join(__dirname, 'images', nameWithExt);
  const outputDir = path.join(__dirname, 'images', 'optimized');
  const outputName = `${baseName}-${size}.${format}`;
  const outputPath = path.join(outputDir, outputName);

  try {
    // Se già esiste, stop
    await fs.access(outputPath).then(() => true).catch(() => false);
  } catch {
    // ignore
  }
  try {
    await fs.access(outputPath);
    return outputName; // già esiste
  } catch {
    // crea outputDir se manca
    await fs.mkdir(outputDir, { recursive: true });
    // genera con sharp
    await sharp(inputPath)
      .resize(SIZES[size], null, { withoutEnlargement: true, fit: 'inside' })
      .toFormat(format, { quality: QUALITY[format] || 80 })
      .toFile(outputPath);
    console.log(`🖼️ Generated ${outputName}`);
    return outputName;
  }
}

// Endpoint on-demand optimization
app.get('/api/optimize', async (req, res) => {
  try {
    const { name, size = 'medium', format = 'webp' } = req.query;
    if (!name) return res.status(400).json({ error: 'name-required' });
    if (!SIZES[size]) return res.status(400).json({ error: 'invalid-size' });
    if (!['jpeg', 'webp', 'avif'].includes(format)) return res.status(400).json({ error: 'invalid-format' });

    const optimizedName = await ensureOptimized(name, size, format);
    return res.json({ path: `images/optimized/${optimizedName}` });
  } catch (err) {
    console.error('optimize-error', err);
    res.status(500).json({ error: 'optimize-failed' });
  }
});

// ---------------- API ----------------
app.get('/api/galleries', async (_req,res) => {
  try {
    const raw = await fs.readFile(DATA_FILE,'utf8');
    res.json(JSON.parse(raw));
  } catch(err){
    console.error('READ galleries.json',err);
    res.status(500).json({error:'read-failed'});
  }
});

app.post('/api/galleries', async (req,res)=>{
  if(req.query.token !== TOKEN){
    return res.status(401).json({error:'invalid-token'});
  }
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(req.body,null,2));
    res.sendStatus(200);
  } catch(err){
    console.error('WRITE galleries.json',err);
    res.status(500).json({error:'write-failed'});
  }
});

// -------- Site meta (bio, contacts, sections) --------
app.get('/api/site', async (_req,res)=>{
  try{
    const raw = await fs.readFile(SITE_FILE,'utf8');
    res.json(JSON.parse(raw));
  }catch(err){
    console.error('READ site.json',err);
    res.status(500).json({error:'read-site-failed'});
  }
});

app.post('/api/site', async (req,res)=>{
  if(req.query.token !== TOKEN){
    return res.status(401).json({error:'invalid-token'});
  }
  try{
    await fs.writeFile(SITE_FILE, JSON.stringify(req.body,null,2));
    res.sendStatus(200);
  }catch(err){
    console.error('WRITE site.json',err);
    res.status(500).json({error:'write-site-failed'});
  }
});

// -------- Upload endpoint --------
app.post('/api/upload', upload.single('file'), (req,res)=>{
  if(req.query.token !== TOKEN){
    // multer has already stored file, optionally delete it
    return res.status(401).json({error:'invalid-token'});
  }
  if(!req.file){
    return res.status(400).json({error:'no-file'});
  }
  // return relative path using forward slashes
  const relPath = req.file.path.replace(__dirname+path.sep,'').split(path.sep).join('/');
  res.json({path: relPath});
});

// -------- Mobile Shader --------
app.get('/api/mobileShader', async (_req,res)=>{
  try{
    const raw = await fs.readFile(SHADER_FILE,'utf8');
    res.type('text/plain').send(raw);
  }catch(err){
    console.error('READ mobile_shader.glsl',err);
    res.status(500).json({error:'read-shader-failed'});
  }
});

app.put('/api/mobileShader', async (req,res)=>{
  if(req.query.token !== TOKEN){
    return res.status(401).json({error:'invalid-token'});
  }
  const text = req.body;
  if(typeof text !== 'string'){
    return res.status(400).json({error:'invalid-body'});
  }
  try{
    await fs.writeFile(SHADER_FILE,text);
    res.sendStatus(200);
  }catch(err){
    console.error('WRITE mobile_shader.glsl',err);
    res.status(500).json({error:'write-shader-failed'});
  }
});

// Only start a standalone server when not running inside Firebase Functions
if (!process.env.FUNCTION_NAME && !process.env.K_SERVICE && !process.env.FIREBASE_CONFIG) {
  app.listen(PORT, () => console.log(`🚀 Portfolio server on http://localhost:${PORT}`));
}

export default app; // allow importing the Express instance in Firebase Functions 