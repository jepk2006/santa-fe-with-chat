import { Database } from '@/types/database.types'
import { createClient } from '@supabase/supabase-js'

export type Tables = Database['public']['Tables']
export type TablesInsert = {
  [TableName in keyof Tables]: Tables[TableName]['Insert']
}
export type TablesUpdate = {
  [TableName in keyof Tables]: Tables[TableName]['Update']
}
export type TablesRow = {
  [TableName in keyof Tables]: Tables[TableName]['Row']
}

// You can add more specific type definitions here as needed 