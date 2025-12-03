## I. Termos de Uso (ou Termos de Aceite)

O Termo de Uso estabelece as regras para a utilização do sistema, os direitos e deveres do usuário e da empresa fornecedora (Licenciante).

### 1. Objeto e Aceitação

- **Objeto:** Descrição do serviço (Sistema de Gestão Online de Instrumentos de Medição) e do que o termo rege (licença de uso, condições de acesso, etc.).
- **Aceitação:** A manifestação inequívoca de que o usuário leu, compreendeu e concorda com o Termo de Uso e a Política de Privacidade (geralmente por meio de um clique em "Aceito" ou pelo uso continuado do sistema).

### 2. Licença de Uso

- **Concessão:** O sistema é disponibilizado de forma gratuita e não é vendido. O usuário adquire o direito de uso por um período determinado e de forma não exclusiva, quando aceita os termos. A Licenciante pode alterar as regras de acesso sem aviso prévio.
- **Restrições:** Proibição de engenharia reversa, cópia, sublicenciamento, venda ou utilização do software para fins ilícitos.
- **Propriedade Intelectual:** Todo o código-fonte, design, logotipos e conteúdo do sistema são de propriedade exclusiva da Licenciante.

### 3. Cadastro e Acesso

- **Dados Cadastrais:** O usuário é responsável pela exatidão e veracidade dos dados fornecidos (e-mail, CNPJ, nome da empresa, etc.).
- **Login e Senha:** O usuário é o único responsável pela guarda e confidencialidade das credenciais de acesso, devendo notificar a Licenciante em caso de uso não autorizado.
- **Usuários Autorizados:** Regras sobre criação e gerenciamento de usuários internos da empresa cliente no sistema.

### 4. Responsabilidades do Usuário (Cliente)

- **Uso Adequado:** Utilizar o sistema estritamente para os fins a que se destina (gestão de instrumentos de medição, calibração, manutenção, etc.).
- **Conteúdo/Dados Inseridos:** O usuário é o único responsável pelos dados e informações que insere no sistema.
- **Legalidade dos Dados:** Garantir base legal e autorizações necessárias para inserir quaisquer dados pessoais de terceiros no sistema.

### 5. Obrigações da Licenciante (Empresa)

- **Disponibilidade:** Garantir a disponibilidade do serviço (SLA, se houver).
- **Segurança:** Adotar medidas técnicas e administrativas para proteger os dados armazenados.
- **Suporte:** Detalhar como e quando o suporte técnico será prestado.

### 6. Cobrança e Pagamento

O sistema não acarreta cobrança no momento, porém, a Licenciante poderá realizar cobrança mediante aviso prévio.

- **Planos:** Condições de pagamento, reajustes e funcionalidades inclusas em cada plano.
- **Inadimplência:** Possibilidade de suspensão do acesso por falta de pagamento.

### 7. Limitação de Responsabilidade

- **Exclusões:** A Licenciante não se responsabiliza por danos indiretos, lucros cessantes ou problemas decorrentes de mau uso, falhas de internet ou força maior.
- **Limitação:** Responsabilidade limitada ao valor pago pelo serviço no período em questão.

### 8. Rescisão

- **Motivos:** Término do prazo, inadimplência ou violação dos termos.
- **Consequências:** Tratamento dos dados após rescisão (prazo para download, exclusão, etc.).

---

## II. Política de Privacidade

A KOMETRO segue as regras definidas pela **Lei Geral de Proteção de Dados (LGPD)** para proteger os dados pessoais.

### 1. Definições Iniciais

- **LGPD:** Lei nº 13.709/2018.
- **Dados Cadastrais:** Usados apenas para cadastro único da empresa (CNPJ, razão social, e-mail etc.) e não são divulgados a terceiros fora da finalidade operacional.

### 2. Dados Coletados e Finalidade

#### a) Dados de Cadastro (Controladora)
- **Coletados:** Razão Social, e-mail, telefone, CNPJ.  
- **Finalidade:** Cadastro e acesso ao sistema.  
- **Base Legal:** Execução de contrato, obrigação legal.

#### b) Dados de Uso do Sistema (Operadora/Controladora)
- **Coletados:** Logs de acesso, IP, cookies, informações do dispositivo.  
- **Finalidade:** Segurança, performance e melhoria do sistema.  
- **Base Legal:** Legítimo interesse e consentimento.

#### c) Dados Inseridos pelo Usuário (Operadora)
- **Coletados:** Dados de instrumentos, calibrações, técnicos/operadores.  
- **Finalidade:** Permitir a gestão e uso do sistema pelo cliente.  
- **Base Legal:** Execução de contrato.  

> O cliente (Controlador) é responsável por garantir a base legal para inserção desses dados.

### 3. Compartilhamento de Dados

Os dados podem ser compartilhados com:
- Provedores de hospedagem cloud,
- Ferramentas de e-mail marketing,
- Processadores de pagamento,
- Autoridades legais.  

Sempre com finalidade legítima e essencial ao serviço.

### 4. Armazenamento e Segurança

#### Dados Estruturados (Banco de Dados)
- **Local:** Servidores KingHost (🇧🇷 Brasil)
- **Tipo:** MySQL 8.0.32
- **Conformidade:** ✅ Dados armazenados no Brasil — conforme LGPD

#### Dados Não-Estruturados (Arquivos, Imagens, Vídeos)
- **Local:** DigitalOcean Spaces (🇺🇸 EUA)
- **Tipo:** Storage compatível com AWS S3
- **Conformidade:** ⚠️ Transferência Internacional (com base legal e cláusulas contratuais)

#### Medidas de Segurança Implementadas

**Autenticação e Acesso**
- JWT (HS256) com expiração
- Refresh tokens com rotação automática
- Permissões por nível (gerente / registrador / observador)
- Controle por grupos e clientes

**Proteção de Dados**
- Senhas criptografadas
- Chaves secretas em variáveis de ambiente
- Comunicação 100% HTTPS

**Segurança de Rede**
- CORS configurado
- CSRF Protection ativa
- Headers de segurança e proteção contra clickjacking

**Controle e Auditoria**
- Permissões granulares
- Logs configurados
- Isolamento de dados por cliente

**Segurança da Aplicação**
- Sanitização e validação de entrada
- ORM Django (proteção contra SQL Injection)
- Rate limiting com Celery/Redis

**Infraestrutura**
- Containers Docker
- Variáveis de ambiente para dados sensíveis
- Backups automáticos + logs estruturados

**Armazenamento de Arquivos**
- ACL configurado
- Separação de estáticos/media
- Cache control aplicado

📄 **Recomendações LGPD (DigitalOcean)**
- Implementar **SCCs (Cláusulas Contratuais Padrão)**
- Documentar **base legal de transferência**
- Adotar **criptografia ponta a ponta**
- Realizar **revisões periódicas de segurança**

### 5. Direitos do Titular (LGPD)

Conforme Art. 18 da LGPD:
- Confirmação da existência de tratamento  
- Acesso aos dados  
- Correção de dados incompletos  
- Anonimização, bloqueio ou eliminação  
- Revogação do consentimento  
- Portabilidade dos dados  
- Eliminação de dados pessoais (salvo exceções legais)

### 6. Encarregado de Dados (DPO)

**Felipe Kovags**  
📧 [lgpd@kometro.com.br](mailto:lgpd@kometro.com.br)  
🏢 Rod. Benjamim Constanti, 4703, Lote 06 – km 05 – Pinheiral – RJ – CEP 27197-000  

Enviar correspondência aos cuidados do **Encarregado pelo Tratamento de Dados Pessoais**.

### 7. Alterações na Política

A política pode ser alterada, e os usuários serão notificados sobre mudanças através de aviso no sistema.
