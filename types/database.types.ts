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
      products: {
        Row: {
          id: string
          created_at: string | null
          name: string
          description: string | null
          price: number
          category: string | null
          image_url: string | null
          selling_method: string
          inventory_count: number | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          name: string
          description?: string | null
          price: number
          category?: string | null
          image_url?: string | null
          selling_method?: string
          inventory_count?: number | null
        }
        Update: {
          id?: string
          created_at?: string | null
          name?: string
          description?: string | null
          price?: number
          category?: string | null
          image_url?: string | null
          selling_method?: string
          inventory_count?: number | null
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
          selling_method: string | null
          weight: number | null
          weight_unit: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          order_id: string
          product_id?: string | null
          name: string
          quantity?: number | null
          price: number
          selling_method?: string | null
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          order_id?: string
          product_id?: string | null
          name?: string
          quantity?: number | null
          price?: number
          selling_method?: string | null
          weight?: number | null
          weight_unit?: string | null
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
          weight_unit: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          cart_id: string
          product_id: string
          quantity?: number
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          cart_id?: string
          product_id?: string
          quantity?: number
          weight?: number | null
          weight_unit?: string | null
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