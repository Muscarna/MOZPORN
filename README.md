# MOZPORN — Primeira versão Next.js

Primeira fase funcional da plataforma, construída com Next.js, TypeScript, Prisma e PostgreSQL.

## Funcionalidades incluídas

- Registo e login reais com palavras-passe protegidas por bcrypt.
- Sessão em cookie `httpOnly`, `sameSite=lax` e `secure` em produção.
- Recuperação e redefinição de palavra-passe com token de uso único e validade de 30 minutos.
- Três níveis de acesso: `USER`, `CREATOR` e `ADMIN`.
- Dashboard de utilizador.
- Candidatura, aprovação e área privada de Creator.
- Perfil público de Creator e sistema de seguidores.
- Área Admin com aprovação/rejeição de candidaturas e registo de auditoria.
- Gate 18+, Termos e Privacidade.

## Requisitos

- Node.js 20 ou superior.
- Docker Desktop, ou uma instalação local do PostgreSQL.

## Executar localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env` e gere um segredo forte:

   ```bash
   cp .env.example .env
   openssl rand -base64 48
   ```

   Substitua o valor de `AUTH_SECRET` pelo resultado. Nunca publique o ficheiro `.env`.

3. Inicie o PostgreSQL:

   ```bash
   docker compose up -d
   ```

4. Crie as tabelas e o utilizador administrador local:

   ```bash
   npm run db:migrate -- --name initial
   npm run db:seed
   ```

5. Inicie a aplicação:

   ```bash
   npm run dev
   ```

6. Abra `http://localhost:3000`.

## Administrador local

O seed usa o email definido em `ADMIN_EMAIL` (ou `admin@mozporn.local`) e exige uma `ADMIN_PASSWORD` com pelo menos 12 caracteres. Defina ambos no `.env` antes de executar o seed. Use credenciais exclusivas para cada ambiente.

## Comandos úteis

```bash
npm run typecheck
npm run build
npm run db:studio
npm run db:deploy
```

## Antes de publicar

- Use PostgreSQL gerido, HTTPS e variáveis de ambiente da plataforma de hospedagem.
- Integre um serviço transacional de email; nesta versão, o link de recuperação aparece somente no terminal local.
- Implemente verificação robusta de idade e identidade dos criadores, consentimento documentado, moderação, denúncias e remoção rápida.
- Confirme as leis aplicáveis em Moçambique e nos países onde o serviço estará disponível, assim como as regras do provedor de hospedagem e pagamentos.
- Não ative uploads ou pagamentos antes de concluir moderação, armazenamento privado, antivírus, controlo de acesso e procedimentos contra conteúdo ilegal ou não consensual.
