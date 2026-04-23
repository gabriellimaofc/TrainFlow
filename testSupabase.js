import { supabase } from './supabaseClient'

export async function testarConexao() {
  const { data, error } = await supabase
    .from('teste') // nome da sua tabela
    .select('*')

  console.log('DATA:', data)
  console.log('ERROR:', error)
}