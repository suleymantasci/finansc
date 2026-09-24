import { Breadcrumb } from '@/components/shared/Breadcrumb';

interface Props {
  items: { label: string; href?: string }[];
  className?: string;
}

export function EnflasyonBreadcrumb({ items, className }: Props) {
  const full = [{ label: 'Ana Sayfa', href: '/' }, ...items];
  return <Breadcrumb items={full} className={className} />;
}