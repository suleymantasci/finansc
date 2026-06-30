import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { SITE_NAME } from '@/lib/constants';

interface Props {
  items: { label: string; href?: string }[];
  className?: string;
}

export function EnflasyonBreadcrumb({ items, className }: Props) {
  const full = [{ label: SITE_NAME, href: '/' }, ...items];
  return <Breadcrumb items={full} className={className} />;
}