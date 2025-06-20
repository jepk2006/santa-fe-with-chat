export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string | null
          name: string | null
          email: string | null
          avatar_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          name?: string | null
          email?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          name?: string | null
          email?: string | null
          avatar_url?: string | null
        }
      }
      locations: {
        Row: {
          id: string
          created_at: string
          name: string
          address: string | null
          is_active: boolean
        }
        Insert: {
          id: string
          created_at?: string
          name: string
          address?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          address?: string | null
          is_active?: boolean
        }
      }
      product_inventory: {
        Row: {
          id: string
          created_at: string
          product_id: string
          location_id: string
          unit_weight: number
          quantity: number
          unit_price: number
          is_available: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          product_id: string
          location_id: string
          unit_weight: number
          quantity: number
          unit_price: number
          is_available?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          product_id?: string
          location_id?: string
          unit_weight?: number
          quantity?: number
          unit_price?: number
          is_available?: boolean
        }
      }
      products: {
        Row: {
          id: string
          created_at: string | null
          name: string
          description: string | null
          price: number
          category: string | null
          image_url: string | null
          inventory_count: number | null
          selling_method: 'unit' | 'weight_custom' | 'weight_fixed'
        }
        Insert: {
          id?: string
          created_at?: string | null
          name: string
          description?: string | null
          price: number
          category?: string | null
          image_url?: string | null
          inventory_count?: number | null
          selling_method?: 'unit' | 'weight_custom' | 'weight_fixed'
        }
        Update: {
          id?: string
          created_at?: string | null
          name?: string
          description?: string | null
          price?: number
          category?: string | null
          image_url?: string | null
          inventory_count?: number | null
          selling_method?: 'unit' | 'weight_custom' | 'weight_fixed'
        }
      }
      orders: {
        Row: {
          id: string
          created_at: string | null
          user_id: string | null
          total_price: number
          status: string
          is_paid: boolean
          is_delivered: boolean
          delivered_at: string | null
          phone_number: string | null
          shipping_address: Json | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          user_id?: string | null
          total_price: number
          status?: string
          is_paid?: boolean
          is_delivered?: boolean
          delivered_at?: string | null
          phone_number?: string | null
          shipping_address?: Json | null
        }
        Update: {
          id?: string
          created_at?: string | null
          user_id?: string | null
          total_price?: number
          status?: string
          is_paid?: boolean
          is_delivered?: boolean
          delivered_at?: string | null
          phone_number?: string | null
          shipping_address?: Json | null
        }
      }
      order_items: {
        Row: {
          id: string
          created_at: string | null
          order_id: string
          product_id: string | null
          name: string
          quantity: number | null
          price: number
          weight: number | null
          selling_method: 'unit' | 'weight_custom' | 'weight_fixed'
          weight_unit: string | null
          locked: boolean
          inventory_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          order_id: string
          product_id?: string | null
          name: string
          quantity?: number | null
          price: number
          weight?: number | null
          selling_method?: 'unit' | 'weight_custom' | 'weight_fixed'
          weight_unit?: string | null
          locked?: boolean
          inventory_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          order_id?: string
          product_id?: string | null
          name?: string
          quantity?: number | null
          price?: number
          weight?: number | null
          selling_method?: 'unit' | 'weight_custom' | 'weight_fixed'
          weight_unit?: string | null
          locked?: boolean
          inventory_id?: string | null
        }
      }
      carts: {
        Row: {
          id: string
          created_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string | null
          user_id?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          created_at: string | null
          cart_id: string
          product_id: string
          quantity: number
          weight: number | null
          selling_method: 'unit' | 'weight_custom' | 'weight_fixed'
          weight_unit: string | null
          locked: boolean
        }
        Insert: {
          id?: string
          created_at?: string | null
          cart_id: string
          product_id: string
          quantity?: number
          weight?: number | null
          selling_method?: 'unit' | 'weight_custom' | 'weight_fixed'
          weight_unit?: string | null
          locked?: boolean
        }
        Update: {
          id?: string
          created_at?: string | null
          cart_id?: string
          product_id?: string
          quantity?: number
          weight?: number | null
          selling_method?: 'unit' | 'weight_custom' | 'weight_fixed'
          weight_unit?: string | null
          locked?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 