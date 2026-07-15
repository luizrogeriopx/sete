export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          chave: string
          updated_at: string
          updated_by: string | null
          valor: Json
        }
        Insert: {
          chave: string
          updated_at?: string
          updated_by?: string | null
          valor: Json
        }
        Update: {
          chave?: string
          updated_at?: string
          updated_by?: string | null
          valor?: Json
        }
        Relationships: []
      }
      aulas: {
        Row: {
          conteudo: string | null
          created_at: string
          descricao: string | null
          duracao_minutos: number | null
          id: string
          material_url: string | null
          modulo_id: string
          ordem: number
          titulo: string
          video_url: string | null
        }
        Insert: {
          conteudo?: string | null
          created_at?: string
          descricao?: string | null
          duracao_minutos?: number | null
          id?: string
          material_url?: string | null
          modulo_id: string
          ordem?: number
          titulo: string
          video_url?: string | null
        }
        Update: {
          conteudo?: string | null
          created_at?: string
          descricao?: string | null
          duracao_minutos?: number | null
          id?: string
          material_url?: string | null
          modulo_id?: string
          ordem?: number
          titulo?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aulas_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes: {
        Row: {
          created_at: string
          curso_id: string
          descricao: string | null
          id: string
          modulo_id: string | null
          nota_minima: number
          titulo: string
        }
        Insert: {
          created_at?: string
          curso_id: string
          descricao?: string | null
          id?: string
          modulo_id?: string | null
          nota_minima?: number
          titulo: string
        }
        Update: {
          created_at?: string
          curso_id?: string
          descricao?: string | null
          id?: string
          modulo_id?: string | null
          nota_minima?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      carteirinhas: {
        Row: {
          aluno_id: string
          emitida_em: string
          id: string
          numero: string
          validade: string
        }
        Insert: {
          aluno_id: string
          emitida_em?: string
          id?: string
          numero: string
          validade: string
        }
        Update: {
          aluno_id?: string
          emitida_em?: string
          id?: string
          numero?: string
          validade?: string
        }
        Relationships: []
      }
      categorias: {
        Row: {
          ativa: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          ordem: number | null
          slug: string
        }
        Insert: {
          ativa?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number | null
          slug: string
        }
        Update: {
          ativa?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          slug?: string
        }
        Relationships: []
      }
      certificados: {
        Row: {
          aluno_id: string
          codigo_validacao: string
          curso_id: string
          emitido_em: string
          id: string
          layout_id: string | null
        }
        Insert: {
          aluno_id: string
          codigo_validacao?: string
          curso_id: string
          emitido_em?: string
          id?: string
          layout_id?: string | null
        }
        Update: {
          aluno_id?: string
          codigo_validacao?: string
          curso_id?: string
          emitido_em?: string
          id?: string
          layout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificados_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificados_layout_id_fkey"
            columns: ["layout_id"]
            isOneToOne: false
            referencedRelation: "layouts_certificado"
            referencedColumns: ["id"]
          },
        ]
      }
      cronograma: {
        Row: {
          created_at: string
          curso_id: string
          data: string
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          local: string | null
          observacao: string | null
          topico: string
        }
        Insert: {
          created_at?: string
          curso_id: string
          data: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          local?: string | null
          observacao?: string | null
          topico: string
        }
        Update: {
          created_at?: string
          curso_id?: string
          data?: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          local?: string | null
          observacao?: string | null
          topico?: string
        }
        Relationships: [
          {
            foreignKeyName: "cronograma_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos: {
        Row: {
          ativo: boolean
          carga_horaria: number | null
          categoria_id: string | null
          created_at: string
          descricao: string | null
          descricao_curta: string | null
          destaque: boolean
          ementa: string | null
          id: string
          imagem_card: string | null
          imagem_capa: string | null
          ministrante_id: string | null
          modalidade: Database["public"]["Enums"]["curso_modalidade"]
          preco: number
          slug: string
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          carga_horaria?: number | null
          categoria_id?: string | null
          created_at?: string
          descricao?: string | null
          descricao_curta?: string | null
          destaque?: boolean
          ementa?: string | null
          id?: string
          imagem_card?: string | null
          imagem_capa?: string | null
          ministrante_id?: string | null
          modalidade?: Database["public"]["Enums"]["curso_modalidade"]
          preco?: number
          slug: string
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          carga_horaria?: number | null
          categoria_id?: string | null
          created_at?: string
          descricao?: string | null
          descricao_curta?: string | null
          destaque?: boolean
          ementa?: string | null
          id?: string
          imagem_card?: string | null
          imagem_capa?: string | null
          ministrante_id?: string | null
          modalidade?: Database["public"]["Enums"]["curso_modalidade"]
          preco?: number
          slug?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cursos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      layouts_certificado: {
        Row: {
          created_at: string
          curso_id: string | null
          id: string
          nome: string
          padrao: boolean
          template_html: string
        }
        Insert: {
          created_at?: string
          curso_id?: string | null
          id?: string
          nome: string
          padrao?: boolean
          template_html: string
        }
        Update: {
          created_at?: string
          curso_id?: string | null
          id?: string
          nome?: string
          padrao?: boolean
          template_html?: string
        }
        Relationships: [
          {
            foreignKeyName: "layouts_certificado_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      matriculas: {
        Row: {
          aluno_id: string
          curso_id: string
          data_conclusao: string | null
          data_matricula: string
          id: string
          observacao: string | null
          progresso: number
          status: Database["public"]["Enums"]["matricula_status"]
        }
        Insert: {
          aluno_id: string
          curso_id: string
          data_conclusao?: string | null
          data_matricula?: string
          id?: string
          observacao?: string | null
          progresso?: number
          status?: Database["public"]["Enums"]["matricula_status"]
        }
        Update: {
          aluno_id?: string
          curso_id?: string
          data_conclusao?: string | null
          data_matricula?: string
          id?: string
          observacao?: string | null
          progresso?: number
          status?: Database["public"]["Enums"]["matricula_status"]
        }
        Relationships: [
          {
            foreignKeyName: "matriculas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      modulos: {
        Row: {
          created_at: string
          curso_id: string
          descricao: string | null
          id: string
          ordem: number
          titulo: string
        }
        Insert: {
          created_at?: string
          curso_id: string
          descricao?: string | null
          id?: string
          ordem?: number
          titulo: string
        }
        Update: {
          created_at?: string
          curso_id?: string
          descricao?: string | null
          id?: string
          ordem?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "modulos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string
          destinatario_id: string | null
          destinatario_role: Database["public"]["Enums"]["app_role"] | null
          enviada_por: string | null
          id: string
          lida: boolean
          link: string | null
          mensagem: string
          titulo: string
        }
        Insert: {
          created_at?: string
          destinatario_id?: string | null
          destinatario_role?: Database["public"]["Enums"]["app_role"] | null
          enviada_por?: string | null
          id?: string
          lida?: boolean
          link?: string | null
          mensagem: string
          titulo: string
        }
        Update: {
          created_at?: string
          destinatario_id?: string | null
          destinatario_role?: Database["public"]["Enums"]["app_role"] | null
          enviada_por?: string | null
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string
          titulo?: string
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          comprovante_url: string | null
          created_at: string
          id: string
          matricula_id: string
          metodo: Database["public"]["Enums"]["pagamento_metodo"]
          mp_payment_id: string | null
          mp_preference_id: string | null
          observacao: string | null
          pago_em: string | null
          registrado_por: string | null
          status: Database["public"]["Enums"]["pagamento_status"]
          updated_at: string
          valor: number
        }
        Insert: {
          comprovante_url?: string | null
          created_at?: string
          id?: string
          matricula_id: string
          metodo: Database["public"]["Enums"]["pagamento_metodo"]
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          observacao?: string | null
          pago_em?: string | null
          registrado_por?: string | null
          status?: Database["public"]["Enums"]["pagamento_status"]
          updated_at?: string
          valor: number
        }
        Update: {
          comprovante_url?: string | null
          created_at?: string
          id?: string
          matricula_id?: string
          metodo?: Database["public"]["Enums"]["pagamento_metodo"]
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          observacao?: string | null
          pago_em?: string | null
          registrado_por?: string | null
          status?: Database["public"]["Enums"]["pagamento_status"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
        ]
      }
      presencas: {
        Row: {
          aluno_id: string
          created_at: string
          cronograma_id: string
          id: string
          justificativa: string | null
          registrada_por: string | null
          status: Database["public"]["Enums"]["presenca_status"]
        }
        Insert: {
          aluno_id: string
          created_at?: string
          cronograma_id: string
          id?: string
          justificativa?: string | null
          registrada_por?: string | null
          status?: Database["public"]["Enums"]["presenca_status"]
        }
        Update: {
          aluno_id?: string
          created_at?: string
          cronograma_id?: string
          id?: string
          justificativa?: string | null
          registrada_por?: string | null
          status?: Database["public"]["Enums"]["presenca_status"]
        }
        Relationships: [
          {
            foreignKeyName: "presencas_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: false
            referencedRelation: "cronograma"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          endereco: Json | null
          foto_url: string | null
          id: string
          nome_completo: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          endereco?: Json | null
          foto_url?: string | null
          id: string
          nome_completo: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          endereco?: Json | null
          foto_url?: string | null
          id?: string
          nome_completo?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      progresso_aula: {
        Row: {
          aula_id: string
          concluida: boolean
          concluida_em: string | null
          id: string
          matricula_id: string
        }
        Insert: {
          aula_id: string
          concluida?: boolean
          concluida_em?: string | null
          id?: string
          matricula_id: string
        }
        Update: {
          aula_id?: string
          concluida?: boolean
          concluida_em?: string | null
          id?: string
          matricula_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progresso_aula_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progresso_aula_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
        ]
      }
      questoes: {
        Row: {
          alternativas: Json
          avaliacao_id: string
          enunciado: string
          id: string
          ordem: number
          peso: number
          resposta_correta: string
        }
        Insert: {
          alternativas: Json
          avaliacao_id: string
          enunciado: string
          id?: string
          ordem?: number
          peso?: number
          resposta_correta: string
        }
        Update: {
          alternativas?: Json
          avaliacao_id?: string
          enunciado?: string
          id?: string
          ordem?: number
          peso?: number
          resposta_correta?: string
        }
        Relationships: [
          {
            foreignKeyName: "questoes_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      secretaria_solicitacoes: {
        Row: {
          aluno_id: string
          atendida_por: string | null
          created_at: string
          descricao: string | null
          id: string
          resposta: string | null
          status: Database["public"]["Enums"]["solicitacao_status"]
          tipo: string
          updated_at: string
        }
        Insert: {
          aluno_id: string
          atendida_por?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          resposta?: string | null
          status?: Database["public"]["Enums"]["solicitacao_status"]
          tipo: string
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          atendida_por?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          resposta?: string | null
          status?: Database["public"]["Enums"]["solicitacao_status"]
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      suporte_tickets: {
        Row: {
          assunto: string
          categoria: string | null
          created_at: string
          id: string
          status: Database["public"]["Enums"]["ticket_status"]
          updated_at: string
          usuario_id: string
        }
        Insert: {
          assunto: string
          categoria?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          updated_at?: string
          usuario_id: string
        }
        Update: {
          assunto?: string
          categoria?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      tentativas_avaliacao: {
        Row: {
          aluno_id: string
          aprovado: boolean
          avaliacao_id: string
          id: string
          nota: number
          realizada_em: string
          respostas: Json
        }
        Insert: {
          aluno_id: string
          aprovado?: boolean
          avaliacao_id: string
          id?: string
          nota?: number
          realizada_em?: string
          respostas: Json
        }
        Update: {
          aluno_id?: string
          aprovado?: boolean
          avaliacao_id?: string
          id?: string
          nota?: number
          realizada_em?: string
          respostas?: Json
        }
        Relationships: [
          {
            foreignKeyName: "tentativas_avaliacao_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_mensagens: {
        Row: {
          autor_id: string
          created_at: string
          id: string
          mensagem: string
          ticket_id: string
        }
        Insert: {
          autor_id: string
          created_at?: string
          id?: string
          mensagem: string
          ticket_id: string
        }
        Update: {
          autor_id?: string
          created_at?: string
          id?: string
          mensagem?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_mensagens_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "suporte_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "secretaria" | "professor" | "aluno"
      curso_modalidade: "online" | "presencial" | "hibrido"
      matricula_status:
        | "pendente"
        | "ativa"
        | "concluida"
        | "cancelada"
        | "trancada"
      pagamento_metodo: "mercadopago" | "dinheiro" | "pix" | "boleto" | "cartao"
      pagamento_status: "pendente" | "aprovado" | "recusado" | "estornado"
      presenca_status: "presente" | "falta" | "justificada"
      solicitacao_status: "pendente" | "em_analise" | "deferida" | "indeferida"
      ticket_status: "aberto" | "em_andamento" | "resolvido" | "fechado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "secretaria", "professor", "aluno"],
      curso_modalidade: ["online", "presencial", "hibrido"],
      matricula_status: [
        "pendente",
        "ativa",
        "concluida",
        "cancelada",
        "trancada",
      ],
      pagamento_metodo: ["mercadopago", "dinheiro", "pix", "boleto", "cartao"],
      pagamento_status: ["pendente", "aprovado", "recusado", "estornado"],
      presenca_status: ["presente", "falta", "justificada"],
      solicitacao_status: ["pendente", "em_analise", "deferida", "indeferida"],
      ticket_status: ["aberto", "em_andamento", "resolvido", "fechado"],
    },
  },
} as const
