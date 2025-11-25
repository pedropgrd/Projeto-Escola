export interface Alunos {
    matricula: string;
    nome: string;
    cpf: string;
    data_nascimento: string; // pode usar Date se preferir
    endereco: string;
    telefone: string;
    nome_responsavel: string;
    id_aluno: number;
    id_usuario: number;
    email_usuario: string;
    criado_em: string;       // ou Date
    atualizado_em: string;   // ou Date
}