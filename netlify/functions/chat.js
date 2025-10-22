// netlify/functions/chat.js
// Netlify Function (non-streaming fallback). Place at netlify/functions/chat.js
// It returns the full assistant reply as JSON. Client-side will use streaming for Vercel, and fallback to this JSON endpoint on Netlify.

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'الطريقة غير مسموح بها' }) };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'جسم الطلب غير صالح' }) };
  }

  const { message, role } = body;
  if (!message) {
    return { statusCode: 400, body: JSON.stringify({ error: 'لم يتم إرسال رسالة.' }) };
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'مفتاح OpenAI غير مضبوط في المتغيرات البيئية.' }) };
  }

  const rolePrompt = {
    student: 'أنت مساعد ودي وبسيط تشرح للطلاب المفاهيم بطريقة مشوقة وسهلة الفهم. أجب باللغة العربية فقط وبأسلوب ودود.',
    teacher: 'أنت مساعد ذكي للمعلمين تقدم استراتيجيات تعليمية وأفكار دروس بشكل مبسط وواضح. أجب باللغة عربية فقط وبأسلوب ودود.',
    admin: 'أنت مساعد إداري ذكي تقدم نصائح تنظيمية وتحليلية بطريقة ودية وواضحة. أجب باللغة عربية فقط وبأسلوب ودود.',
  };

  const prompt = `${rolePrompt[role] || rolePrompt.student}\n\nسؤال المستخدم: ${message}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI error:', errText);
      return { statusCode: 500, body: JSON.stringify({ error: 'خطأ من واجهة OpenAI.' }) };
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || 'لم أتمكن من توليد رد حالياً.';
    return { statusCode: 200, body: JSON.stringify({ reply }) };
  } catch (err) {
    console.error('Netlify function error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'حدث خطأ أثناء التواصل مع نموذج الذكاء الاصطناعي.' }) };
  }
};
