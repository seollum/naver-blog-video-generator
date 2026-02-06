"""
Senior Audiobook Automation Pipeline (SAAP)
Media Assembly Script - Python Version for n8n Code Node

이 스크립트는 Self-hosted n8n 환경에서 moviepy를 사용하여
오디오와 이미지를 병합하여 비디오를 생성합니다.

Requirements:
- moviepy
- Pillow (PIL)
"""

import os
import json
import base64
import tempfile
import shutil
from pathlib import Path

try:
    from moviepy.editor import (
        ImageClip, AudioFileClip, concatenate_videoclips, CompositeVideoClip
    )
    from moviepy.config import change_settings
    # If ffmpeg is in a custom location, uncomment and modify:
    # change_settings({"FFMPEG_BINARY": "/usr/bin/ffmpeg"})
except ImportError as e:
    raise ImportError(f"moviepy is required. Install with: pip install moviepy. Error: {e}")

try:
    from PIL import Image
except ImportError:
    raise ImportError("Pillow is required. Install with: pip install Pillow")

import urllib.request

def download_file(url: str, dest_path: str) -> str:
    """Download a file from URL to destination path."""
    try:
        urllib.request.urlretrieve(url, dest_path)
        return dest_path
    except Exception as e:
        raise Exception(f"Failed to download {url}: {e}")

def resize_image(image_path: str, target_size: tuple = (1920, 1080)) -> str:
    """Resize image to target size while maintaining aspect ratio with padding."""
    with Image.open(image_path) as img:
        # Calculate scaling to fit within target while maintaining aspect ratio
        width_ratio = target_size[0] / img.width
        height_ratio = target_size[1] / img.height
        scale = min(width_ratio, height_ratio)
        
        new_width = int(img.width * scale)
        new_height = int(img.height * scale)
        
        # Resize image
        resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Create new image with black background
        final = Image.new('RGB', target_size, (0, 0, 0))
        
        # Paste resized image in center
        x = (target_size[0] - new_width) // 2
        y = (target_size[1] - new_height) // 2
        final.paste(resized, (x, y))
        
        # Save back to same path
        final.save(image_path, 'PNG')
        return image_path

def assemble_audiobook(scenes: list, title: str, output_dir: str) -> dict:
    """
    Assemble scenes into a single audiobook video.
    
    Args:
        scenes: List of scene dictionaries with audio_url, image_url, duration
        title: Title for the output file
        output_dir: Directory for temporary and output files
    
    Returns:
        Dictionary with success status and file information
    """
    clips = []
    temp_files = []
    
    try:
        for i, scene in enumerate(scenes):
            print(f"Processing scene {i + 1}/{len(scenes)}...")
            
            # Download audio and image
            audio_path = os.path.join(output_dir, f"audio_{i}.mp3")
            image_path = os.path.join(output_dir, f"image_{i}.png")
            
            download_file(scene['audio_url'], audio_path)
            download_file(scene['image_url'], image_path)
            
            temp_files.extend([audio_path, image_path])
            
            # Resize image to 1080p
            resize_image(image_path, (1920, 1080))
            
            # Create audio clip to get duration
            audio_clip = AudioFileClip(audio_path)
            duration = audio_clip.duration
            
            # Create image clip with audio duration
            image_clip = ImageClip(image_path, duration=duration)
            image_clip = image_clip.set_audio(audio_clip)
            image_clip = image_clip.set_fps(24)
            
            clips.append(image_clip)
            print(f"Scene {i + 1} processed: {duration:.2f}s")
        
        # Concatenate all clips
        print("Concatenating all clips...")
        final_clip = concatenate_videoclips(clips, method="compose")
        
        # Generate output filename
        safe_title = "".join(c if c.isalnum() or c in (' ', '_', '-') else '_' for c in title)
        output_filename = f"{safe_title}_audiobook.mp4"
        output_path = os.path.join(output_dir, output_filename)
        
        # Write final video
        print("Rendering final video...")
        final_clip.write_videofile(
            output_path,
            codec='libx264',
            audio_codec='aac',
            fps=24,
            preset='medium',
            bitrate='5000k',
            audio_bitrate='192k',
            threads=4,
            logger=None  # Suppress verbose output
        )
        
        # Close all clips to release resources
        final_clip.close()
        for clip in clips:
            clip.close()
        
        # Read output as base64
        with open(output_path, 'rb') as f:
            video_data = f.read()
        
        video_base64 = base64.b64encode(video_data).decode('utf-8')
        
        return {
            "success": True,
            "filename": output_filename,
            "file_size_bytes": len(video_data),
            "duration_seconds": final_clip.duration if hasattr(final_clip, 'duration') else 0,
            "scenes_count": len(scenes),
            "video_base64": video_base64
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "scenes_count": len(scenes)
        }
    finally:
        # Cleanup temporary files
        for f in temp_files:
            try:
                os.remove(f)
            except:
                pass

def main():
    """Main function for n8n Code Node execution."""
    # Get input data from n8n
    # In n8n Python Code Node, use _input.all() or _input.first()
    input_data = _input.first()
    
    # Extract scenes data
    scenes = input_data.json.get('data', [])
    
    # Get title from webhook
    webhook_data = _node('Webhook Trigger').first()
    title = webhook_data.json.get('body', {}).get('title', 'audiobook')
    
    # Create temporary directory
    temp_dir = tempfile.mkdtemp(prefix='saap_')
    
    try:
        result = assemble_audiobook(scenes, title, temp_dir)
        
        if result['success']:
            # Return with binary data for n8n
            return [{
                "json": {
                    "success": True,
                    "filename": result['filename'],
                    "file_size_bytes": result['file_size_bytes'],
                    "scenes_count": result['scenes_count']
                },
                "binary": {
                    "video": {
                        "data": result['video_base64'],
                        "mimeType": "video/mp4",
                        "fileName": result['filename']
                    }
                }
            }]
        else:
            return [{
                "json": {
                    "success": False,
                    "error": result['error']
                }
            }]
    finally:
        # Cleanup temp directory
        shutil.rmtree(temp_dir, ignore_errors=True)

# Execute main function
return main()
