import { z } from 'zod';

// ── Form Şeması (Zod) ─────────────────────────────────────────────

export const maasFormSchema = z.object({
  year: z.coerce.number().int().min(2024).max(2099),
  month: z.coerce.number().int().min(1).max(12),
  direction: z.enum(['brutten-nete', 'netten-brute']),
  employeeType: z.enum(['4a-ucretli', '4a-emekli', '4b-esnaf', '4c-memur', '4a-stajyer', '4a-ev-hizmet-10', '4a-ev-hizmet-30']),
  amount: z.coerce.number().min(1, 'Maaş tutarı giriniz'),
  disability: z.enum(['yok', 'birinci', 'ikinci', 'ucuncu']),
  /** Kümülatif gelir vergisi matrahı (yıl başından beri) */
  cumulativeMatrah: z.coerce.number().min(0),
  /** Asgari ücret istisnasi kümülatif matrahı */
  minWageCumulativeMatrah: z.coerce.number().min(0),
  /** İşveren maliyetini göster */
  showEmployerCost: z.boolean(),
});

export type MaasFormData = z.infer<typeof maasFormSchema>;
