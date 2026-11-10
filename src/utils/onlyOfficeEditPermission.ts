import {z} from 'zod';

const permissionResponseSchema = z.object({can_edit: z.boolean()});

/** The authenticated backend decides ownership and submission state. */
export function getOfficeMode({excelData, isHistoryPreview}: {
  excelData: unknown;
  isHistoryPreview: boolean;
  loginUser?: unknown;
}): 'edit' | 'view' {
  if (isHistoryPreview) return 'view';
  const permission = permissionResponseSchema.safeParse(excelData);
  return permission.success && permission.data.can_edit ? 'edit' : 'view';
}
