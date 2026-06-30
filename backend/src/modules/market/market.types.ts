// tasci-api'den dönen shape (search-sadece kullandigi alanlar).
// Service + Controller arasinda paylasilan tipler — NestJS decorator
// metadata emission icin gerekli (TS4053 export visibility).
export interface BorsaStock {
  symbol: string;
  name: string;
}

export interface BorsaIndex {
  symbol: string;
  name: string;
}
