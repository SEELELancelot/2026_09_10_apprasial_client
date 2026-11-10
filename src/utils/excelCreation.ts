import { z } from 'zod';

const responseSchema = z.object({
  success: z.number(),
  message: z.string().optional(),
});
const documentSchema = z.object({
  success: z.literal(1),
  excelId: z.string().trim().min(1),
  excelName: z.string().trim().min(1),
});
const errorSchema = z.object({
  code: z.string().optional(),
  response: z.object({ data: z.object({ message: z.string().trim().min(1) }) }).optional(),
});

class ExcelCreationError extends Error {}

export function readExcelCreationResponse(input: unknown): z.infer<typeof documentSchema> {
  const response = responseSchema.safeParse(input);
  if (!response.success) {
    throw new ExcelCreationError('建立文件的回應格式錯誤，請返回列表確認文件是否已建立。');
  }
  if (response.data.success !== 1) {
    throw new ExcelCreationError(response.data.message?.trim() || '建立文件失敗，請返回列表確認。');
  }
  const document = documentSchema.safeParse(input);
  if (!document.success) {
    throw new ExcelCreationError('後端未回傳完整的文件名稱或文件 ID，請返回列表確認文件是否已建立。');
  }
  return document.data;
}

export function getExcelCreationError(error: unknown, fallback: string): string {
  if (error instanceof ExcelCreationError) return error.message;
  const parsed = errorSchema.safeParse(error);
  if (!parsed.success) return fallback;
  if (parsed.data.response) return parsed.data.response.data.message;
  if (['ECONNABORTED', 'ETIMEDOUT'].includes(parsed.data.code || '')) {
    return '建立文件逾時，請先返回列表確認文件是否已建立，避免重複建立。';
  }
  if (parsed.data.code === 'ERR_NETWORK') {
    return '無法連線至後端服務，請確認後端連線後返回列表。';
  }
  return fallback;
}
