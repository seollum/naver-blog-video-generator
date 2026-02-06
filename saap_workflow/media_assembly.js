/**
 * Senior Audiobook Automation Pipeline (SAAP)
 * Media Assembly Script - JavaScript Version for n8n Code Node
 * 
 * 이 스크립트는 Make.com 외부 렌더링을 사용할 수 없는 경우
 * Self-hosted n8n 환경에서 ffmpeg를 사용하여 미디어를 병합합니다.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const util = require('util');

const execAsync = util.promisify(exec);

// Helper function to download file from URL
async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        downloadFile(response.headers.location, destPath)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(destPath);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// Main assembly function
async function assembleMedia() {
  // Get all scene data from aggregated input
  const scenes = $input.first().json.data;
  const title = $('Webhook Trigger').first().json.body.title || 'audiobook';
  
  // Create temporary directory
  const timestamp = Date.now();
  const outputDir = `/tmp/saap_${timestamp}`;
  fs.mkdirSync(outputDir, { recursive: true });
  
  console.log(`Processing ${scenes.length} scenes...`);
  
  // Download all assets
  const downloadPromises = scenes.map(async (scene, index) => {
    const audioPath = path.join(outputDir, `audio_${index}.mp3`);
    const imagePath = path.join(outputDir, `image_${index}.png`);
    
    await Promise.all([
      downloadFile(scene.audio_url, audioPath),
      downloadFile(scene.image_url, imagePath)
    ]);
    
    return {
      index,
      audioPath,
      imagePath,
      duration: scene.duration || 15
    };
  });
  
  const assets = await Promise.all(downloadPromises);
  console.log('All assets downloaded.');
  
  // Create concat file for ffmpeg
  const concatFilePath = path.join(outputDir, 'concat.txt');
  const clipPaths = [];
  
  // Create individual clips for each scene
  for (const asset of assets) {
    const clipPath = path.join(outputDir, `clip_${asset.index}.mp4`);
    clipPaths.push(clipPath);
    
    // Create video clip from image with audio
    // -loop 1: loop the image
    // -t: duration (from audio or estimated)
    // -i: input files (image, audio)
    // -c:v libx264: video codec
    // -tune stillimage: optimize for still images
    // -c:a aac: audio codec
    // -shortest: end when shortest input ends
    const cmd = `ffmpeg -y -loop 1 -i "${asset.imagePath}" -i "${asset.audioPath}" ` +
      `-c:v libx264 -tune stillimage -c:a aac -b:a 192k ` +
      `-vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1" ` +
      `-pix_fmt yuv420p -shortest "${clipPath}"`;
    
    console.log(`Creating clip ${asset.index + 1}/${assets.length}...`);
    await execAsync(cmd);
  }
  
  // Write concat file
  const concatContent = clipPaths.map(p => `file '${p}'`).join('\n');
  fs.writeFileSync(concatFilePath, concatContent);
  
  // Concatenate all clips
  const outputPath = path.join(outputDir, `${title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_final.mp4`);
  const concatCmd = `ffmpeg -y -f concat -safe 0 -i "${concatFilePath}" ` +
    `-c:v libx264 -preset medium -crf 23 -c:a aac -b:a 192k "${outputPath}"`;
  
  console.log('Concatenating clips...');
  await execAsync(concatCmd);
  
  // Read output file as binary
  const videoBuffer = fs.readFileSync(outputPath);
  const videoBase64 = videoBuffer.toString('base64');
  
  // Cleanup temporary files
  console.log('Cleaning up temporary files...');
  fs.rmSync(outputDir, { recursive: true, force: true });
  
  console.log('Media assembly complete!');
  
  return [{
    json: {
      success: true,
      filename: `${title}_audiobook.mp4`,
      scenes_count: scenes.length,
      file_size_bytes: videoBuffer.length
    },
    binary: {
      video: {
        data: videoBase64,
        mimeType: 'video/mp4',
        fileName: `${title}_audiobook.mp4`
      }
    }
  }];
}

// Execute and return
return await assembleMedia();
