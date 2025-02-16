import { createClient } from '@/utils/supabase/server';

export default async function Health() {
  const supabase = await createClient();
  const { data: instruments } = await supabase.from("Sample").select();

  return <pre>{JSON.stringify(instruments, null, 2)}</pre>
}