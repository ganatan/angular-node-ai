import express from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

import testJoggAI from '../services/video/test-joggai.js';

import generateVideo from '../services/video/video.service.js';
import generateVideoMock from '../mocks/video/video.mock.js';

dotenv.config();

const router = express.Router();
const useMock = process.env.USE_MOCK === 'true';

function safeFilename(name, llm) {
  return `${name.toLowerCase().replace(/\s+/g, '-')}-${llm}`;
}

router.post('/:llm', async (req, res) => {
  const { llm } = req.params;
  const { name } = req.body;

  const avatarId = process.env.JOGGAI_AVATAR_ID || '1025';
  const fileName = safeFilename(name, llm);

  const videoPath = path.join(process.cwd(), 'storage', 'videos', `${fileName}.mp4`);
  const audioPath = path.join(process.cwd(), 'storage', 'voices', `${fileName}.mp3`);
  try {
    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ success: false, error: 'Fichier audio introuvable' });
    }

    const outputDir = path.dirname(videoPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    if (useMock) {
      await generateVideoMock(videoPath);
      console.log('🟡 AVATAR MOCK -', videoPath);
    } else {
      await generateVideo(text, avatarId, videoPath);
      console.log('✅ AVATAR réel -', audioPath);
    }

    const publicPathVideo = `/storage/videos/${fileName}.mp4`;
    const publicPathPoster = `/storage/videos/${fileName}.png`;
    const fullUrlVideo = `${req.protocol}://${req.get('host')}${publicPathVideo}`;
    const fullUrlPoster = `${req.protocol}://${req.get('host')}${publicPathPoster}`;

    const dataVideo = {
      url: fullUrlVideo,
      poster: fullUrlPoster,
    };

    return res.json({
      success: true,
      data: dataVideo,
      mock: useMock,
    });

  } catch (err) {
    console.error('❌ Erreur génération AVATAR :', err.message);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

router.get('/health/lva', async (req, res) => {
  const avatarId = process.env.JOGGAI__AVATAR_ID || '1025';
  const result = await testJoggAI(avatarId);
  res.json({ success: result });
});

export default router;
