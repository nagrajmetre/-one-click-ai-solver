export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST method only allowed.",
    });
  }

  try {
    const contentType = req.headers["content-type"] || "";

    if (!contentType.includes("multipart/form-data")) {
      return res.status(400).json({
        error: "Please submit a question or image.",
      });
    }

    const Busboy = (await import("busboy")).default;

    const bb = Busboy({
      headers: req.headers,
      limits: {
        files: 1,
        fileSize: MAX_IMAGE_SIZE,
        fields: 4,
      },
    });

    const fields = {};
    let imageData = null;
    let imageMimeType = null;
    let tooLarge = false;

    await new Promise((resolve, reject) => {
      bb.on("field", (name, value) => {
        fields[name] = value;
      });

      bb.on("file", (name, stream, info) => {
        const chunks = [];

        imageMimeType = info.mimeType;

        stream.on("limit", () => {
          tooLarge = true;
        });

        stream.on("data", (chunk) => chunks.push(chunk));

        stream.on("end", () => {
          imageData = Buffer.concat(chunks);
        });
      });

      bb.on("error", reject);
      bb.on("close", resolve);

      req.pipe(bb);
    });

    if (tooLarge) {
      return res.status(413).json({
        error: "Image must be smaller than 5 MB.",
      });
    }

    const question = (fields.question || "").trim();

    if (!question && !imageData) {
      return res.status(400).json({
        error: "Please type a question or upload an image.",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing in Vercel settings.",
      });
    }

    const language = fields.language || "English";
    const subject = fields.subject || "Auto detect";
    const style = fields.style || "Answer + explanation";

    const prompt = `
You are a helpful AI tutor.
Answer the student's question accurately.
Respond in ${language}.
Subject: ${subject}.
Answer style: ${style}.
Explain clearly at the student's level.
${question ? `Question: ${question}` : ""}
`;

    const parts = [{ text: prompt }];

    if (imageData) {
      if (
        !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
          imageMimeType
        )
      ) {
        return res.status(400).json({
          error: "Unsupported image type.",
        });
      }

      parts.push({
        inlineData: {
          mimeType: imageMimeType,
          data: imageData.toString("base64"),
        },
      });
    }

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts }],
        }),
      }
    );

    const result = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini API error:", result);

      return res.status(502).json({
        error:
          result.error?.message ||
          "Gemini API request failed. Check your API key and model access.",
      });
    }

    const answer = result.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!answer) {
      return res.status(502).json({
        error: "Gemini did not return an answer. Please try again.",
      });
    }

    return res.status(200).json({ answer });
  } catch (error) {
    console.error("Solve API error:", error);

    return res.status(500).json({
      error: "Server error while solving the question.",
    });
  }
        }
