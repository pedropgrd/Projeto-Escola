# 🔍 Queries SQL para Validação e Debug

Este arquivo contém queries SQL úteis para validar os dados e fazer debug do sistema.

## 📊 Verificar Estrutura das Tabelas

```sql
-- Ver todas as tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Ver estrutura de uma tabela específica
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;
```

## 👤 Consultas de Usuários

```sql
-- Listar todos os usuários ativos
SELECT id, email, nome_completo, perfil, ativo, criado_em
FROM usuarios
WHERE ativo = true
ORDER BY criado_em DESC;

-- Contar usuários por perfil
SELECT perfil, COUNT(*) as total
FROM usuarios
WHERE ativo = true
GROUP BY perfil;

-- Buscar usuário por email
SELECT *
FROM usuarios
WHERE email = 'admin@escola.com'
  AND ativo = true;
```

## 🎓 Consultas de Alunos

```sql
-- Listar alunos ativos (não deletados)
SELECT 
    a.id_aluno,
    a.matricula,
    a.nome,
    u.email,
    a.telefone,
    a.data_nascimento,
    a.criado_em
FROM aluno a
JOIN usuarios u ON a.id_usuario = u.id
WHERE a.is_deleted = false
ORDER BY a.nome;

-- Verificar soft deletes
SELECT 
    id_aluno,
    nome,
    matricula,
    is_deleted,
    deleted_at
FROM aluno
WHERE is_deleted = true;

-- Alunos sem usuário (dados órfãos)
SELECT a.*
FROM aluno a
LEFT JOIN usuarios u ON a.id_usuario = u.id
WHERE u.id IS NULL;
```

## 👨‍🏫 Consultas de Professores

```sql
-- Listar professores ativos
SELECT 
    p.id_professor,
    p.nome,
    p.email,
    p.telefone,
    u.email as usuario_email,
    COUNT(t.id_turma) as total_turmas
FROM professor p
JOIN usuarios u ON p.id_usuario = u.id
LEFT JOIN turma t ON p.id_professor = t.id_professor 
    AND t.is_deleted = false
WHERE p.is_deleted = false
GROUP BY p.id_professor, p.nome, p.email, p.telefone, u.email
ORDER BY p.nome;
```

## 📚 Consultas de Turmas e Disciplinas

```sql
-- Listar turmas com professor e disciplina
SELECT 
    t.id_turma,
    t.nome as turma,
    t.ano_letivo,
    p.nome as professor,
    d.nome as disciplina,
    d.serie,
    d.turno,
    COUNT(at.id_aluno) as total_alunos
FROM turma t
JOIN professor p ON t.id_professor = p.id_professor
JOIN disciplina d ON t.id_disciplina = d.id_disciplina
LEFT JOIN aluno_turma at ON t.id_turma = at.id_turma 
    AND at.is_deleted = false
WHERE t.is_deleted = false
  AND p.is_deleted = false
  AND d.is_deleted = false
GROUP BY t.id_turma, t.nome, t.ano_letivo, p.nome, d.nome, d.serie, d.turno
ORDER BY t.ano_letivo DESC, t.nome;

-- Alunos de uma turma específica
SELECT 
    a.id_aluno,
    a.nome,
    a.matricula,
    u.email,
    at.criado_em as matriculado_em
FROM aluno_turma at
JOIN aluno a ON at.id_aluno = a.id_aluno
JOIN usuarios u ON a.id_usuario = u.id
WHERE at.id_turma = 1  -- Substituir pelo ID da turma
  AND at.is_deleted = false
  AND a.is_deleted = false
ORDER BY a.nome;

-- Turmas de um aluno específico
SELECT 
    t.id_turma,
    t.nome as turma,
    t.ano_letivo,
    d.nome as disciplina,
    p.nome as professor,
    at.criado_em as matriculado_em
FROM aluno_turma at
JOIN turma t ON at.id_turma = t.id_turma
JOIN disciplina d ON t.id_disciplina = d.id_disciplina
JOIN professor p ON t.id_professor = p.id_professor
WHERE at.id_aluno = 1  -- Substituir pelo ID do aluno
  AND at.is_deleted = false
  AND t.is_deleted = false
ORDER BY t.ano_letivo DESC, t.nome;
```

## 📰 Consultas de Notícias e Eventos

```sql
-- Últimas notícias (não deletadas)
SELECT 
    id_noticia,
    titulo,
    LEFT(conteudo, 100) as preview,
    data,
    criado_em
FROM noticias
WHERE is_deleted = false
ORDER BY data DESC, criado_em DESC
LIMIT 10;

-- Eventos futuros
SELECT 
    id_evento,
    titulo,
    data,
    LEFT(conteudo, 100) as preview
FROM eventos
WHERE is_deleted = false
  AND data >= CURRENT_DATE
ORDER BY data;

-- Contar fotos por evento
SELECT 
    e.id_evento,
    e.titulo,
    COUNT(g.id_imagem) as total_fotos
FROM eventos e
LEFT JOIN galeria g ON e.id_evento = g.id_evento 
    AND g.is_deleted = false
WHERE e.is_deleted = false
GROUP BY e.id_evento, e.titulo
ORDER BY total_fotos DESC;
```

## 📅 Consultas de Calendário

```sql
-- Eventos do calendário (próximos 30 dias)
SELECT 
    id_calendario,
    data,
    evento,
    descricao
FROM calendario
WHERE is_deleted = false
  AND data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY data;

-- Calendário do mês atual
SELECT 
    data,
    evento,
    descricao
FROM calendario
WHERE is_deleted = false
  AND EXTRACT(YEAR FROM data) = EXTRACT(YEAR FROM CURRENT_DATE)
  AND EXTRACT(MONTH FROM data) = EXTRACT(MONTH FROM CURRENT_DATE)
ORDER BY data;
```

## 🔍 Queries de Auditoria e Estatísticas

```sql
-- Total de registros por tabela (apenas ativos)
SELECT 
    'Usuários' as tabela,
    COUNT(*) as total
FROM usuarios
WHERE ativo = true

UNION ALL

SELECT 
    'Alunos' as tabela,
    COUNT(*) as total
FROM aluno
WHERE is_deleted = false

UNION ALL

SELECT 
    'Professores' as tabela,
    COUNT(*) as total
FROM professor
WHERE is_deleted = false

UNION ALL

SELECT 
    'Disciplinas' as tabela,
    COUNT(*) as total
FROM disciplina
WHERE is_deleted = false

UNION ALL

SELECT 
    'Turmas' as tabela,
    COUNT(*) as total
FROM turma
WHERE is_deleted = false

UNION ALL

SELECT 
    'Matrículas' as tabela,
    COUNT(*) as total
FROM aluno_turma
WHERE is_deleted = false

UNION ALL

SELECT 
    'Notícias' as tabela,
    COUNT(*) as total
FROM noticias
WHERE is_deleted = false

UNION ALL

SELECT 
    'Eventos' as tabela,
    COUNT(*) as total
FROM eventos
WHERE is_deleted = false;

-- Registros deletados (soft delete) por tabela
SELECT 
    'Alunos' as tabela,
    COUNT(*) as deletados,
    MAX(deleted_at) as ultimo_delete
FROM aluno
WHERE is_deleted = true

UNION ALL

SELECT 
    'Professores' as tabela,
    COUNT(*) as deletados,
    MAX(deleted_at) as ultimo_delete
FROM professor
WHERE is_deleted = true

UNION ALL

SELECT 
    'Turmas' as tabela,
    COUNT(*) as deletados,
    MAX(deleted_at) as ultimo_delete
FROM turma
WHERE is_deleted = true;

-- Atividade recente (últimos 7 dias)
SELECT 
    'Alunos Criados' as atividade,
    COUNT(*) as total
FROM aluno
WHERE criado_em >= CURRENT_DATE - INTERVAL '7 days'
  AND is_deleted = false

UNION ALL

SELECT 
    'Turmas Criadas' as atividade,
    COUNT(*) as total
FROM turma
WHERE criado_em >= CURRENT_DATE - INTERVAL '7 days'
  AND is_deleted = false

UNION ALL

SELECT 
    'Notícias Criadas' as atividade,
    COUNT(*) as total
FROM noticias
WHERE criado_em >= CURRENT_DATE - INTERVAL '7 days'
  AND is_deleted = false;
```

## 🧹 Queries de Limpeza (CUIDADO!)

```sql
-- ⚠️ ATENÇÃO: Use com cuidado! Estas queries modificam dados

-- Reativar um aluno deletado (desfazer soft delete)
UPDATE aluno
SET is_deleted = false,
    deleted_at = NULL,
    atualizado_em = CURRENT_TIMESTAMP
WHERE id_aluno = 1;  -- Substituir pelo ID

-- Deletar permanentemente registros antigos (>1 ano de soft delete)
-- ⚠️ MUITO PERIGOSO - Fazer backup antes!
DELETE FROM aluno
WHERE is_deleted = true
  AND deleted_at < CURRENT_DATE - INTERVAL '1 year';

-- Limpar matriculas duplicadas (manter a mais recente)
DELETE FROM aluno_turma
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY id_aluno, id_turma 
                   ORDER BY criado_em DESC
               ) as rn
        FROM aluno_turma
        WHERE is_deleted = false
    ) t
    WHERE t.rn > 1
);
```

## 🐛 Queries de Debug

```sql
-- Verificar integridade referencial
-- Alunos sem usuário
SELECT a.id_aluno, a.nome, a.id_usuario
FROM aluno a
LEFT JOIN usuarios u ON a.id_usuario = u.id
WHERE u.id IS NULL
  AND a.is_deleted = false;

-- Turmas com professor ou disciplina inexistente
SELECT 
    t.id_turma,
    t.nome,
    t.id_professor,
    p.nome as professor_nome,
    t.id_disciplina,
    d.nome as disciplina_nome
FROM turma t
LEFT JOIN professor p ON t.id_professor = p.id_professor
LEFT JOIN disciplina d ON t.id_disciplina = d.id_disciplina
WHERE t.is_deleted = false
  AND (p.id_professor IS NULL OR d.id_disciplina IS NULL);

-- Matrículas com aluno ou turma inexistente
SELECT 
    at.id,
    at.id_aluno,
    a.nome as aluno_nome,
    at.id_turma,
    t.nome as turma_nome
FROM aluno_turma at
LEFT JOIN aluno a ON at.id_aluno = a.id_aluno
LEFT JOIN turma t ON at.id_turma = t.id_turma
WHERE at.is_deleted = false
  AND (a.id_aluno IS NULL OR t.id_turma IS NULL);

-- Verificar tamanho das imagens na galeria
SELECT 
    id_imagem,
    descricao,
    CASE 
        WHEN imagem IS NULL THEN 'SEM IMAGEM'
        ELSE pg_size_pretty(octet_length(imagem))
    END as tamanho,
    data
FROM galeria
WHERE is_deleted = false
ORDER BY octet_length(imagem) DESC NULLS LAST;
```

## 📈 Dashboard Queries

```sql
-- Dashboard completo (estatísticas gerais)
SELECT 
    (SELECT COUNT(*) FROM usuarios WHERE ativo = true) as usuarios_ativos,
    (SELECT COUNT(*) FROM aluno WHERE is_deleted = false) as total_alunos,
    (SELECT COUNT(*) FROM professor WHERE is_deleted = false) as total_professores,
    (SELECT COUNT(*) FROM turma WHERE is_deleted = false AND ano_letivo = EXTRACT(YEAR FROM CURRENT_DATE)) as turmas_ativas,
    (SELECT COUNT(*) FROM disciplina WHERE is_deleted = false) as total_disciplinas,
    (SELECT COUNT(*) FROM aluno_turma WHERE is_deleted = false) as matriculas_ativas,
    (SELECT COUNT(*) FROM noticias WHERE is_deleted = false AND data >= CURRENT_DATE - INTERVAL '30 days') as noticias_recentes,
    (SELECT COUNT(*) FROM eventos WHERE is_deleted = false AND data >= CURRENT_DATE) as eventos_futuros;
```

## 💾 Backup e Restore

```sql
-- Exportar dados de uma tabela para CSV (exemplo)
COPY (
    SELECT * FROM aluno WHERE is_deleted = false
) TO '/tmp/alunos_backup.csv' WITH CSV HEADER;

-- Importar dados de CSV
COPY aluno(matricula, nome, data_nascimento, endereco, telefone, id_usuario)
FROM '/tmp/alunos_backup.csv' WITH CSV HEADER;
```

---

## 🔧 Como Usar

1. **pgAdmin**: Cole as queries na aba Query Tool
2. **psql**: Execute diretamente no terminal
3. **DBeaver**: Use o SQL Editor
4. **Python**: Use com `psycopg2` ou `asyncpg`

## ⚠️ Avisos Importantes

- ❌ **NUNCA** execute queries de DELETE sem WHERE clause
- ❌ **NUNCA** delete registros com `is_deleted = false` (use soft delete)
- ✅ **SEMPRE** faça backup antes de modificar dados
- ✅ **SEMPRE** teste em ambiente de desenvolvimento primeiro
- ✅ Use transações: `BEGIN; ... ROLLBACK;` para testar sem aplicar

---

**Use estas queries com responsabilidade! 🔒**
