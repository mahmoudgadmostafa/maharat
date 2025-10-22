// api/chat.js (Vercel Serverless Function - Node 18+ / Edge)
// This handler attempts to stream the assistant reply to the client as a text stream.
// Vercel supports streaming responses from Serverless Edge functions or Node 18+ runtime.
// Place this file at /api/chat.js in your repo (Vercel will use it automatically).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'الطريقة غير مسموح بها' });
    return;
  }

  const { message, role } = req.body || {};
  if (!message) {
    res.status(400).json({ error: 'لم يتم إرسال رسالة.' });
    return;
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    res.status(500).json({ error: 'مفتاح OpenAI غير مضبوط في المتغيرات البيئية.' });
    return;
  }

  const rolePrompt = {
    student: 'أنت مساعد ودي وبسيط تشرح للطلاب المفاهيم بطريقة مشوقة وسهلة الفهم. أجب باللغة العربية فقط وبأسلوب ودود.',
    teacher: 'أنت مساعد ذكي للمعلمين تقدم استراتيجيات تعليمية وأفكار دروس بشكل مبسط وواضح. أجب باللغة العربية فقط وبأسلوب ودود.',
    admin: 'أنت مساعد إداري ذكي تقدم نصائح تنظيمية وتحليلية بطريقة ودية وواضحة. أجب باللغة العربية فقط وبأسلوب ودود.',
  };

  const prompt = `${rolePrompt[role] || rolePrompt.student}\n\nسؤال المستخدم: ${message}`;

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'تحدث فقط باللغة العربية بأسلوب ودي مبسط، وكن دائمًا إيجابيًا ومشجعًا.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.3,
        stream: true
      })
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('OpenAI error:', errText);
      res.status(500).json({ error: 'خطأ من واجهة OpenAI.' });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    });

    const reader = openaiRes.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let done = false;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        const chunk = decoder.decode(value);
        res.write(chunk);
      }
    }
    res.end();
  } catch (err) {
    console.error('Vercel streaming error', err);
    res.status(500).json({ error: 'حدث خطأ أثناء التواصل مع نموذج الذكاء الاصطناعي.' });
  }
}
