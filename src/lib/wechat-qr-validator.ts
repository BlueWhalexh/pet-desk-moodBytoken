import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type ValidationResult = {
  ok: boolean;
  reasoning: string;
  raw: Record<string, unknown>;
};

type QrValidationRaw = {
  is_qr_code?: boolean;
  is_wechat_group_invite?: boolean;
  contains_inappropriate_content?: boolean;
  contains_faces_or_people?: boolean;
  confidence?: number;
  reasoning?: string;
};

export async function validateQrImage(
  buffer: Buffer,
): Promise<ValidationResult> {
  const base64 = buffer.toString("base64");
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: 'Look at this image. Reply with strict JSON only: {"is_qr_code": boolean, "is_wechat_group_invite": boolean, "contains_inappropriate_content": boolean, "contains_faces_or_people": boolean, "confidence": number, "reasoning": string}. is_wechat_group_invite means it has the WeChat green logo and looks like a group invite QR. confidence is 0-1.',
          },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${base64}` },
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
  });

  const raw = JSON.parse(
    response.choices[0]?.message?.content ?? "{}",
  ) as QrValidationRaw;

  const ok =
    raw.is_qr_code === true &&
    raw.is_wechat_group_invite === true &&
    raw.contains_inappropriate_content === false &&
    (raw.confidence ?? 0) >= 0.85;

  return {
    ok,
    reasoning: raw.reasoning ?? "no reasoning",
    raw: raw as Record<string, unknown>,
  };
}
