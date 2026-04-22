import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";

type AppBindings = CloudflareBindings & {
  tezu_memories_db: D1Database;
  tezu_memories_bucket: R2Bucket;
  BASIC_USERNAME: string;
  BASIC_PASSWORD: string;
};

type MemoryRecord = {
  id: number | string;
  image_url: string;
  message: string;
  created_at: string;
};

const app = new Hono<{ Bindings: AppBindings }>();

app.use("*", async (c, next) => {
  const auth = basicAuth({
    username: c.env.BASIC_USERNAME,
    password: c.env.BASIC_PASSWORD,
  });
  return auth(c, next);
});

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderMemoryCard = (memory: MemoryRecord, index: number) => {
  const message = escapeHtml(memory.message || "");
  const imageUrl = escapeHtml(memory.image_url || "");

  const isEven = index % 2 === 0;
  const flexDir = isEven ? "md:flex-row" : "md:flex-row-reverse";

  const rainbowSvg = !isEven
    ? `
    <div class="hidden md:block absolute -left-16 sm:-left-32 top-1/2 -translate-y-1/2">
      <svg class="w-40 h-40 opacity-85" viewBox="0 0 100 100">
        <path d="M 10,100 A 90,90 0 0,1 100,10" fill="none" stroke="#ffb3c6" stroke-width="7" stroke-linecap="round" filter="url(#crayon)"/>
        <path d="M 23,100 A 77,77 0 0,1 100,23" fill="none" stroke="#fbe985" stroke-width="7" stroke-linecap="round" filter="url(#crayon)"/>
        <path d="M 36,100 A 64,64 0 0,1 100,36" fill="none" stroke="#a0c4ff" stroke-width="7" stroke-linecap="round" filter="url(#crayon)"/>
      </svg>
    </div>`
    : "";

  const motifType = index % 3;
  let motifHtml = "";

  if (motifType === 0) {
    motifHtml = `
      <div class="absolute -bottom-8 -right-8 sm:-bottom-10 sm:-right-10 flex justify-center items-center z-20 opacity-95 drop-shadow-lg scale-[0.8] sm:scale-100 origin-bottom-right">
        <div class="absolute w-28 h-28 bg-pink-100 rounded-full -rotate-[15deg] translate-x-6"></div>
        <div class="absolute w-32 h-32 bg-rose-50 rounded-full rotate-[15deg] -translate-x-6"></div>
        <div class="absolute w-24 h-28 bg-pink-100 rounded-full -rotate-[60deg] -translate-y-4"></div>
        <div class="absolute w-24 h-28 bg-rose-50 rounded-full rotate-[60deg] -translate-y-4"></div>
        <div class="absolute w-30 h-30 bg-rose-100 rounded-full z-10"></div>
        <div class="w-14 h-14 bg-yellow-100 rounded-full absolute z-20 flex items-center justify-center">
          <div class="w-8 h-8 bg-amber-200 rounded-full"></div>
        </div>
      </div>
    `;
  } else if (motifType === 1) {
    motifHtml = `
      <div class="absolute -bottom-10 left-1/2 flex -translate-x-1/2 justify-center items-end z-0 opacity-95 drop-shadow-sm w-[120%] scale-[0.8] sm:scale-100 origin-bottom">
        <div class="w-28 h-28 bg-lime-200 -rotate-12 translate-x-10" style="border-radius: 100% 0 100% 0;"></div>
        <div class="w-32 h-32 bg-green-200 -rotate-45 z-10 translate-y-6" style="border-radius: 100% 0 100% 0;"></div>
        <div class="w-28 h-28 bg-emerald-200 rotate-12 -translate-x-10" style="border-radius: 0 100% 0 100%;"></div>
      </div>
    `;
  } else {
    motifHtml = `
      <div class="absolute -bottom-12 left-1/2 flex -translate-x-1/2 justify-center items-center z-0 opacity-95 drop-shadow-md w-[130%] scale-[0.8] sm:scale-100 origin-bottom">
        <div class="w-24 h-24 bg-green-200 absolute -left-6 top-8 -rotate-[60deg]" style="border-radius: 100% 0 100% 0;"></div>
        <div class="w-24 h-24 bg-green-200 absolute -right-6 top-8 rotate-[60deg]" style="border-radius: 0 100% 0 100%;"></div>
        <div class="absolute w-28 h-28 bg-amber-100 rounded-full -rotate-[15deg] translate-x-6"></div>
        <div class="absolute w-32 h-32 bg-yellow-50 rounded-full rotate-[15deg] -translate-x-6"></div>
        <div class="absolute w-24 h-28 bg-amber-100 rounded-full -rotate-[60deg] -translate-y-4"></div>
        <div class="absolute w-24 h-28 bg-yellow-50 rounded-full rotate-[60deg] -translate-y-4"></div>
        <div class="absolute w-30 h-30 bg-yellow-100 rounded-full z-10"></div>
        <div class="w-14 h-14 bg-orange-100 rounded-full absolute z-20 flex items-center justify-center">
          <div class="w-8 h-8 bg-amber-200 rounded-full"></div>
        </div>
      </div>
    `;
  }

  return `
    <article class="relative flex flex-col ${flexDir} items-center justify-center gap-10 sm:gap-16 py-12 sm:py-16">
      ${rainbowSvg}

      <div class="relative flex justify-center shrink-0 w-full md:w-[60%] lg:w-[65%] mt-8 sm:mt-0">
        
        <div class="relative inline-block w-auto max-w-full">
          ${motifHtml}

          <div class="relative z-10 p-3 bg-white shadow-xl rounded-sm ${isEven ? "rotate-2" : "-rotate-2"} transition-transform duration-500 hover:rotate-0">
            <img
              src="${imageUrl}"
              alt="思い出の写真"
              loading="lazy"
              class="max-h-[350px] sm:max-h-[450px] md:max-h-[500px] w-auto max-w-full rounded-sm"
            />
          </div>
        </div>
      </div>

      <div class="w-full flex-1 text-center ${isEven ? "md:text-left" : "md:text-right"} z-10 px-4 sm:px-0">
        <p class="text-lg sm:text-2xl text-slate-700 leading-loose tracking-wide whitespace-pre-wrap">${message}</p>
      </div>
    </article>
  `;
};

app.get("/images/:key", async (c) => {
  const key = c.req.param("key");
  const object = await c.env.tezu_memories_bucket.get(key);

  if (!object) return c.notFound();

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  return new Response(object.body, { headers });
});

app.get("/upload", (c) => {
  const html = `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>思い出を記録する</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Kiwi+Maru&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { 
        background: radial-gradient(circle at top, rgba(224, 249, 255, 0.95), rgba(203, 240, 255, 0.9) 40%, #e5f8ff 100%);
        font-family: 'Kiwi Maru', serif;
      }
    </style>
  </head>
  <body class="min-h-screen bg-sky-100 text-slate-900 antialiased">
    <div class="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10 sm:px-8">
      <header class="mb-10 rounded-[32px] sm:rounded-[40px] border border-white/70 bg-white/80 p-6 sm:p-8 shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm">
        <h1 class="mb-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">思い出を記録する</h1>
        <p class="text-sm sm:text-base text-slate-600">てづちゃんとの大切な思い出を追加してください。</p>
      </header>
      <main class="rounded-[24px] sm:rounded-[32px] bg-white/85 p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <form id="upload-form" action="/upload" method="POST" enctype="multipart/form-data" class="space-y-6">
          <div>
            <label class="mb-2 block text-sm font-medium text-slate-700">写真</label>
            <input type="file" name="image" accept="image/*" required class="block w-full text-sm text-slate-500 file:block file:mb-3 md:file:inline-block md:file:mb-0 md:file:mr-4 file:rounded-full file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sky-700 hover:file:bg-sky-100" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-slate-700">いつ、どんな場面？</label>
            <textarea name="message" rows="4" required class="block w-full rounded-2xl border border-slate-300 bg-sky-50 p-4 shadow-sm focus:border-sky-500 focus:ring-sky-500" placeholder="例：2025年の夏、みんなでお散歩に行った時の写真です。"></textarea>
          </div>
          <div class="flex items-center justify-between pt-4">
            <a href="/" class="text-sm font-medium text-sky-600 hover:text-sky-800">← 戻る</a>
            <button id="submit-btn" type="submit" class="rounded-full bg-sky-400 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors">保存する</button>
          </div>
        </form>
      </main>
    </div>

    <script>
      document.getElementById('upload-form').addEventListener('submit', function() {
        const btn = document.getElementById('submit-btn');
        btn.disabled = true;
        btn.innerText = 'アップロード中...';
        btn.classList.add('opacity-70', 'cursor-not-allowed');
        btn.classList.remove('hover:bg-sky-500');
      });
    </script>
  </body>
</html>`;
  return c.html(html);
});

app.post("/upload", async (c) => {
  try {
    const formData = await c.req.parseBody();
    const image = formData["image"];
    const message = formData["message"];

    if (!(image instanceof File)) return c.html("画像が必要です", 400);

    if (!image.type.startsWith("image/")) {
      return c.html("画像ファイルのみアップロード可能です", 400);
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (image.size > MAX_SIZE) {
      return c.html(
        "ファイルサイズが大きすぎます。10MB以下の画像にしてください",
        400,
      );
    }

    const allowedExts = ["jpg", "jpeg", "png", "gif", "webp", "avif"];
    const originalExt = (image.name.split(".").pop() || "").toLowerCase();
    const ext = allowedExts.includes(originalExt) ? originalExt : "jpg";

    const key = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    await c.env.tezu_memories_bucket.put(key, await image.arrayBuffer(), {
      httpMetadata: { contentType: image.type },
    });

    const imageUrl = `/images/${key}`;
    await c.env.tezu_memories_db
      .prepare("INSERT INTO memories (image_url, message) VALUES (?, ?)")
      .bind(imageUrl, typeof message === "string" ? message : "")
      .run();

    return c.redirect("/");
  } catch (error) {
    return c.html("アップロードに失敗しました", 500);
  }
});

app.get("/", async (c) => {
  try {
    const result = await c.env.tezu_memories_db
      .prepare(
        "SELECT id, image_url, message, created_at FROM memories ORDER BY created_at DESC",
      )
      .all<MemoryRecord>();

    const memories = result.results ?? [];
    const memoriesHtml = memories
      .map((memory, index) => renderMemoryCard(memory, index))
      .join("");

    const html = `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>てづちゃんとの思い出</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Kiwi+Maru&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { 
        background: radial-gradient(circle at top, rgba(224, 249, 255, 0.95), rgba(203, 240, 255, 0.9) 40%, #e5f8ff 100%);
        font-family: 'Kiwi Maru', serif;
      }
    </style>
  </head>
  <body class="min-h-screen bg-sky-100 text-slate-900 antialiased overflow-x-hidden">
    <svg width="0" height="0" class="absolute hidden">
      <filter id="crayon">
        <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>

    <div class="mx-auto flex min-h-screen max-w-5xl flex-col px-4 sm:px-12 py-8">
      
      <header class="relative mb-24 sm:mb-32 flex flex-col-reverse md:flex-row justify-between items-center md:items-start gap-12 md:gap-0">
        
        <a href="/upload" class="inline-flex mt-4 items-center rounded-full bg-white/70 px-6 py-3 text-sm font-bold text-sky-600 shadow-sm backdrop-blur-md hover:bg-white transition-colors z-20">
          ＋ 思い出を追加
        </a>

        <div class="relative mt-8 md:mt-0">
          <svg class="absolute -top-12 -left-12 sm:-top-16 sm:-left-16 w-28 h-28 sm:w-36 sm:h-36 opacity-85" viewBox="0 0 100 100">
            <path d="M 10,100 A 90,90 0 0,1 100,10" fill="none" stroke="#ffb3c6" stroke-width="8" stroke-linecap="round" filter="url(#crayon)"/>
            <path d="M 25,100 A 75,75 0 0,1 100,25" fill="none" stroke="#fbe985" stroke-width="8" stroke-linecap="round" filter="url(#crayon)"/>
            <path d="M 40,100 A 60,60 0 0,1 100,40" fill="none" stroke="#a0c4ff" stroke-width="8" stroke-linecap="round" filter="url(#crayon)"/>
          </svg>

          <div class="relative z-10 rounded-[40px] sm:rounded-[50px] bg-white/85 px-8 py-10 sm:px-12 sm:py-14 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm">
            <h1 class="text-3xl sm:text-4xl font-bold leading-relaxed text-slate-800 whitespace-nowrap">
              てづちゃん<br/>ありがとう
            </h1>
            <p class="mt-4 text-xl sm:text-2xl text-slate-600 font-medium whitespace-nowrap">
              楽園でまた会おうね
            </p>
          </div>
        </div>
      </header>

      <main class="flex-1 space-y-20 sm:space-y-24 pb-32">
        ${memoriesHtml || '<p class="text-center text-slate-500 mt-20 text-lg">まだ思い出がありません。</p>'}
      </main>
    </div>
  </body>
</html>`;

    return c.html(html);
  } catch (e) {
    console.error(`例外が発生しました：${e}`);
    return c.html("読み込み失敗", 500);
  }
});

export default app;
