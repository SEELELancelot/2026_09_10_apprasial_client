import React from 'react';
import { z } from 'zod';

const resultSchema = z.object({
  templateVersion: z.literal('v2'),
  blankArray: z.array(z.object({sheet: z.object({
    employeeName: z.string(), isManager: z.boolean(),
    scores: z.record(z.string(), z.object({
      name: z.string(), value: z.union([z.string(), z.number(), z.null()]), error: z.string().optional(),
    })),
  })})),
});

export default function VersionedAppraisalCheck({data}: {data: unknown}) {
  const result = resultSchema.safeParse(data);
  if (!result.success) return <p role="alert">檢核回應格式錯誤，請重新檢核。</p>;
  const rows = result.data.blankArray;
  return <div>
    <h3 style={{textAlign: 'center', color: rows.length ? 'red' : 'blue'}}>
      {rows.length ? `${rows.length} 人資料異常` : '檢核無誤'}
    </h3>
    {rows.map(({sheet}, i) => <table key={`${sheet.employeeName}-${i}`} className="apprasial_checkExcel_Table">
      <tbody>
        <tr><td colSpan={2}>{sheet.employeeName}（{sheet.isManager ? '主管' : '員工'}）</td></tr>
        {Object.entries(sheet.scores).map(([cell, field]) => <tr key={cell} style={{color: field.error ? 'red' : undefined}}>
          <td>{field.name}</td>
          <td>{field.value ?? ''}{field.error && <span>（{field.error}）</span>}</td>
        </tr>)}
      </tbody>
    </table>)}
  </div>;
}
