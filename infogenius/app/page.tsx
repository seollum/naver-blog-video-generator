'use client';

import { useState } from 'react';
import { Sparkles, Download, ChevronDown, ChevronUp, Loader2, Wand2 } from 'lucide-react';

interface InfographicResult {
  style: string;
  prompt: string;
  imageUrl: string;
}

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState<InfographicResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<number>>(new Set());

  const handleGenerate = async () => {
    if (inputText.length < 50) {
      setError('Please enter at least 50 characters');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setCurrentStep(1);

    try {
      // Step 1: Analyzing text
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentStep(2);

      // Step 2: Creating prompts
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentStep(3);

      // Step 3: Generating images
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate infographics');
      }

      setResults(data.results);
      setCurrentStep(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setCurrentStep(0);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePrompt = (index: number) => {
    const newExpanded = new Set(expandedPrompts);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedPrompts(newExpanded);
  };

  const handleDownload = async (imageUrl: string, style: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `infographic-${style.toLowerCase()}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                InfoGenius
              </h1>
              <p className="text-sm text-gray-400">Text-to-Infographic Generator</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Input Section */}
        <div className="mb-8">
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 shadow-2xl">
            <label htmlFor="input-text" className="block text-lg font-semibold text-gray-200 mb-3">
              Enter your text
            </label>
            <textarea
              id="input-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Describe your topic, concept, or information that you want to visualize as an infographic. The more detailed your description, the better the results! (Minimum 50 characters)"
              className="w-full h-40 px-4 py-3 bg-gray-950 border border-gray-700 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isLoading}
            />
            <div className="flex items-center justify-between mt-4">
              <span className={`text-sm ${inputText.length < 50 ? 'text-red-400' : 'text-green-400'}`}>
                {inputText.length} / 50 characters minimum
              </span>
              <button
                onClick={handleGenerate}
                disabled={isLoading || inputText.length < 50}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate Infographics
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-950/50 border border-red-800 rounded-xl text-red-400">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Process Visualization */}
        {isLoading && (
          <div className="mb-8">
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-200 mb-4">Processing...</h3>
              <div className="space-y-3">
                {[
                  { step: 1, label: 'Analyzing your text' },
                  { step: 2, label: 'Creating optimized prompts' },
                  { step: 3, label: 'Generating infographics with AI' },
                ].map(({ step, label }) => (
                  <div key={step} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= step
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'bg-gray-800 text-gray-500'
                        }`}
                    >
                      {currentStep > step ? '✓' : step}
                    </div>
                    <span className={`${currentStep >= step ? 'text-gray-200' : 'text-gray-500'}`}>
                      {label}
                    </span>
                    {currentStep === step && <Loader2 className="w-4 h-4 animate-spin text-blue-400 ml-auto" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Gallery */}
        {results.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Your Infographics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden shadow-2xl hover:shadow-blue-900/20 transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="aspect-square bg-gray-950 relative group">
                    <img
                      src={result.imageUrl}
                      alt={`${result.style} infographic`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <button
                        onClick={() => handleDownload(result.imageUrl, result.style)}
                        className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
                      >
                        <Download className="w-6 h-6 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-200 mb-2">{result.style} Style</h3>

                    {/* Prompt Toggle */}
                    <button
                      onClick={() => togglePrompt(index)}
                      className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 mb-2 transition-colors"
                    >
                      {expandedPrompts.has(index) ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Hide Prompt
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          View Prompt
                        </>
                      )}
                    </button>

                    {expandedPrompts.has(index) && (
                      <p className="text-xs text-gray-400 bg-gray-950 p-3 rounded-lg mb-3 max-h-32 overflow-y-auto">
                        {result.prompt}
                      </p>
                    )}

                    <button
                      onClick={() => handleDownload(result.imageUrl, result.style)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && results.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="inline-flex p-6 bg-gray-900/50 rounded-full mb-4">
              <Sparkles className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Ready to create amazing infographics</h3>
            <p className="text-gray-500">Enter your text above and click Generate to get started</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-950/50 backdrop-blur-xl mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>Powered by OpenAI GPT-4o & DALL-E 3</p>
        </div>
      </footer>
    </div>
  );
}
