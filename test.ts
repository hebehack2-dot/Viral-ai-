import fs from 'fs';

async function testNvidia() {
  try {
    const res = await fetch('https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-3-medium', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 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',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'A small cat',
        cfg_scale: 5,
        seed: 0
      })
    });
    const data = await res.json();
    console.log(JSON.stringify(data).substring(0, 200));
  } catch (e) {
    console.error(e);
  }
}

testNvidia();
