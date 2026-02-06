# InfoGenius - Text-to-Infographic Generator 🎨

An AI-powered web application that transforms plain text into professional infographics using OpenAI's GPT-4o and DALL-E 3.

## ✨ Features

- **Smart Prompt Engineering**: GPT-4o analyzes your text and creates optimized prompts for infographic generation
- **Multiple Styles**: Generates 3 different infographic styles simultaneously:
  - 🎯 Minimalist (Flat Vector, Corporate Blue)
  - 🎮 Isometric (3D, Vibrant, Playful)
  - 🚀 Futuristic (Dark Mode, Neon, Cyberpunk)
- **Real-time Progress**: Visual feedback showing each step of the generation process
- **Image Download**: One-click download for all generated infographics
- **Responsive Design**: Beautiful dark-mode UI that works on all devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **AI**: OpenAI GPT-4o (Prompt Engineering) + DALL-E 3 (Image Generation)
- **Icons**: Lucide React
- **Styling**: Dark mode with gradient accents and glassmorphism

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

## 📖 How to Use

1. **Enter Your Text**: Type or paste at least 50 characters describing your topic
2. **Click Generate**: Watch the AI process your text in 3 steps
3. **View Results**: Browse through 3 different infographic styles
4. **Download**: Click the download button to save your favorite designs

## 🎯 Example Input

```
Renewable energy sources are transforming our power grid. Solar panels convert 
sunlight into electricity, wind turbines harness natural air currents, and 
hydroelectric dams use flowing water. Together, these technologies are reducing 
carbon emissions and creating a sustainable energy future.
```

## 🔧 Project Structure

```
infogenius/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts      # Backend API logic
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main UI component
├── .env.local                # Environment variables
├── package.json              # Dependencies
└── README.md                 # This file
```

## ⚙️ API Workflow

1. **Input Validation**: Checks text length (50-2000 characters)
2. **Prompt Generation** (GPT-4o):
   - Analyzes user text
   - Creates 3 specialized prompts for different visual styles
   - Optimized for minimal text, maximum visual impact
3. **Image Generation** (DALL-E 3):
   - Parallel processing of all 3 prompts
   - 1024x1024 high-quality images
   - Returns image URLs + prompts

## 🎨 Infographic Styles

| Style | Description | Color Palette |
|-------|-------------|---------------|
| **Minimalist** | Clean flat vectors, simple icons, corporate aesthetic | Blue tones, white space |
| **Isometric** | 3D perspective, depth, playful modern design | Vibrant multi-color |
| **Futuristic** | Dark theme, neon accents, data visualization | Cyan, Magenta, Dark |

## 🚧 Error Handling

The application handles:
- Missing or invalid API keys
- Text length validation
- OpenAI API rate limits
- Image generation failures
- Network errors

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | ✅ Yes |

## 🔒 Security Notes

- Never commit `.env.local` to version control
- Keep your OpenAI API key private
- Monitor your OpenAI usage to avoid unexpected costs

## 💰 Cost Considerations

- **GPT-4o**: ~$0.005 per request
- **DALL-E 3**: ~$0.04 per image (×3 = $0.12 per generation)
- **Total**: ~$0.125 per full infographic set

## 🐛 Troubleshooting

**"Failed to generate prompts"**
- Check your OpenAI API key in `.env.local`
- Ensure you have sufficient API credits

**Images not loading**
- DALL-E 3 generation can take 20-40 seconds
- Check browser console for errors
- Verify internet connection

## 📄 License

MIT License - Feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [OpenAI](https://openai.com/)
- Icons by [Lucide](https://lucide.dev/)
