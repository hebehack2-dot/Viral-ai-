import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const apiKeyMatch = envFile.match(/VITE_NVIDIA_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

async function test() {
  const prompt = "A viral YouTube thumbnail about playing a high-end mobile game on a low-end 2GB RAM phone. The image features a split-screen or dynamic layout. On one side, a frustrated but excited gamer's face with a glowing expression. On the other side, a close-up of a glowing, overheating old smartphone displaying intense gaming action. Bold, massive, glowing 3D text overlay saying '2GB RAM?!' or 'IT WORKED!'. Neon lighting, high contrast, vibrant colors, clickbait style, 8k resolution, masterpiece.";
  
  const nvidiaRes = await fetch('https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-dev', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: prompt,
      seed: 42,
      steps: 28,
      width: 1280,
      height: 768
    })
  });
  
  const data = await nvidiaRes.json();
  console.log("Status:", nvidiaRes.status);
  if (data.artifacts && data.artifacts.length > 0) {
    console.log("Got image, length:", data.artifacts[0].base64.length);
    console.log("Finish reason:", data.artifacts[0].finishReason);
    fs.writeFileSync('test-thumb.jpg', Buffer.from(data.artifacts[0].base64, 'base64'));
  } else {
    console.log("Response:", JSON.stringify(data, null, 2));
  }
}

test();
