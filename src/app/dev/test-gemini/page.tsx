import { testGemini } from '@/ai/flows/test-gemini-flow';
import Header from '@/components/layout/header';
import { Suspense } from 'react';

async function GeminiTestResult() {
  const result = await testGemini("Say 'Hello World!'");
  const isError = result.startsWith('Error:');

  return (
    <div className="p-6 border rounded-lg max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Gemini API Test Result</h2>
      <p className="text-sm text-muted-foreground mb-2">The test sent the prompt: "Say 'Hello World!'"</p>
      <div className={`p-4 rounded-md ${isError ? 'bg-destructive/10 border-destructive/50 border' : 'bg-secondary'}`}>
        <p className={`font-mono text-sm ${isError ? 'text-destructive-foreground' : 'text-secondary-foreground'}`}>
          {result}
        </p>
      </div>
      {!isError && (
        <p className="mt-4 text-green-600 font-medium">
          Success! Your Gemini API key is working correctly.
        </p>
      )}
      {isError && (
         <p className="mt-4 text-red-600 font-medium">
          Failed. Please check the error message above and ensure your API key is configured correctly in your environment variables.
        </p>
      )}
    </div>
  );
}


export default function TestGeminiPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <Suspense fallback={
            <div className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">Running Gemini API test...</p>
            </div>
        }>
          <GeminiTestResult />
        </Suspense>
      </main>
    </div>
  );
}
