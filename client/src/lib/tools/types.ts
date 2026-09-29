// Bildirimsel hesaplama aracı tanımı. Bir araç = alanlar + saf hesaplama fonksiyonu + açıklama
// metni. GenericTool alanları çizer, değerleri URL'de tutar (paylaşılabilir link), sonucu anlık
// hesaplar; sayfa açıklama/SSS kısmını sunucuda çizer (SEO).

export interface FieldBase {
  key: string;
  label: string;
  help?: string;
  /** Alan yalnızca koşul sağlanınca görünür ve hesaba girer */
  showIf?: (v: Values) => boolean;
  /** Geniş ekranda tam satır kaplar */
  wide?: boolean;
}

export interface NumberField extends FieldBase {
  type: 'number';
  default: number | null;
  unit?: string;
  min?: number;
  max?: number;
  /** Tam sayı alanı */
  integer?: boolean;
  optional?: boolean;
  placeholder?: string;
  /** Yüklenen veriye göre ipucu (ör. boş bırakılırsa kullanılacak canlı fiyat) */
  placeholderFrom?: (data: unknown, v: Values) => string | undefined;
}

export interface TextField extends FieldBase {
  type: 'text';
  default: string;
  placeholder?: string;
  optional?: boolean;
  /** Mobil klavye ve otomatik düzeltme ayarları */
  inputMode?: 'text' | 'numeric';
  uppercase?: boolean;
}

export interface SelectField extends FieldBase {
  type: 'select';
  options: { value: string; label: string }[];
  default: string;
  /** Az seçenekte düğme grubu olarak çiz */
  segmented?: boolean;
}

export interface DateField extends FieldBase {
  type: 'date';
  /** 'today' veya bugüne göre hesaplanan varsayılan */
  default: string | ((today: string) => string);
  optional?: boolean;
}

export interface ToggleField extends FieldBase {
  type: 'toggle';
  default: boolean;
}

export interface RowsField extends FieldBase {
  type: 'rows';
  columns: { key: string; label: string; unit?: string }[];
  default: number[][];
  maxRows?: number;
  addLabel?: string;
}

export type Field = NumberField | TextField | SelectField | DateField | ToggleField | RowsField;

export type Value = number | string | boolean | number[][];
export type Values = Record<string, Value>;

export type Tone = 'up' | 'down' | 'primary';

export interface ResultRow {
  label: string;
  value: string;
  tone?: Tone;
  strong?: boolean;
  hint?: string;
}

export interface CalcResult {
  headline: { label: string; value: string; sub?: string; tone?: Tone };
  rows?: ResultRow[];
  sections?: { title: string; rows: ResultRow[] }[];
  table?: { caption?: string; columns: string[]; rows: string[][]; note?: string; /** İlk N satırı göster, kalanı açılır bölümde */ collapseAfter?: number };
  notes?: string[];
  warnings?: string[];
  /** Paylaşım metni için kısa özet; verilmezse headline kullanılır */
  shareText?: string;
}

export type CalcOutput = CalcResult | { error: string } | null;

export type DataStatus = 'none' | 'loading' | 'ready' | 'error';

export interface ComputeContext {
  today: string;
  /** spec.data ile yüklenen veri (hazır değilse undefined) */
  data?: unknown;
  dataStatus: DataStatus;
}

/**
 * Hesap için dış veri (canlı fiyat, TÜFE endeksi, geçmiş kur). `key` girdilere göre hangi verinin
 * gerektiğini söyler; null ise veri istenmez. Aynı anahtar bir kez indirilir ve önbelleğe alınır.
 */
export interface DataSource {
  key: (v: Values) => string | null;
  load: (v: Values, signal: AbortSignal) => Promise<unknown>;
  /** Kullanıcıya gösterilen kaynak adı (ör. "TCMB TÜFE endeksi") */
  label?: string;
}

export interface ToolInfoContent {
  /** Hesaplamanın nasıl yapıldığı — paragraflar */
  how: string[];
  /** Formül satırları */
  formula?: string[];
  faqs: { q: string; a: string }[];
  sources?: { label: string; url: string }[];
}

export interface ToolSpec {
  slug: string;
  intro?: string;
  fields: Field[];
  compute: (v: Values, ctx: ComputeContext) => CalcOutput;
  info: ToolInfoContent;
  data?: DataSource;
  /** Eski sürümün farklı biçimli URL parametrelerini alan değerlerine çevirir (paylaşılmış linkler bozulmasın) */
  legacyQuery?: (sp: URLSearchParams) => Record<string, number | string | boolean | number[][]>;
}

export function isResult(o: CalcOutput): o is CalcResult {
  return !!o && !('error' in o);
}
