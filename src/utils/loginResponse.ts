import {z} from 'zod';

const loginResponseSchema=z.discriminatedUnion('success',[
  z.object({success:z.literal(1),token:z.string().min(1)}),
  z.object({success:z.literal(-1),message:z.string()}),
]);
export function readLoginResponse(input:unknown):z.infer<typeof loginResponseSchema> {
  const result=loginResponseSchema.safeParse(input);
  if (!result.success) throw new Error('登入回應格式錯誤，請確認後端服務版本');
  return result.data;
}
