import { redirect } from 'next/navigation';
import { defaultLocale } from '../middleware';

export default function Page() {
  redirect(`/${defaultLocale}`);
}
