import { Avatar, Box, Typography, useTheme, Link } from '@mui/material';
import React from 'react';

function EmptyYet({
  content,
  isMobile,
  isFiltering = false,
  table = false,
  isDashboard = false,
  onCreate,
  onClick = () => {},
  showKaka = true,
}) {
  const theme = useTheme();

  const messages = {
    proposta: (
      <>
        <Typography variant="h6" color={theme.palette.info.main}>
          Nenhuma proposta encontrada.
        </Typography>
        <Typography variant="body1" color={theme.palette.info.main}>
          {isFiltering ? (
            "Ops! Nenhuma proposta corresponde aos filtros aplicados."
          ) : (
            <>
              <Link
                component="button"
                onClick={onClick}
                underline="always"
                color="primary"
                sx={{ fontWeight: 500 }}
              >
                Clique aqui
              </Link>{" "}
              para criar uma nova proposta.
            </>
          )}
        </Typography>
      </>
    ),
    instrumento: (
      <>
        <Typography variant="h6" color={theme.palette.info.main}>
          {isDashboard ? "Nenhum instrumento cadastrado" : "Nenhum instrumento selecionado."}
        </Typography>
        <Typography variant="body1" color={theme.palette.info.main}>
        {isDashboard && <Link
            component="button"
            onClick={onClick}
            underline="always"
            color="primary"
            sx={{ fontWeight: 500 }}
          >
            Clique aqui
          </Link>}{isDashboard ? 'para começar a cadastrar os instrumentos.' : 'Para começar, selecione um setor. Depois, você poderá visualizar os instrumentos existentes ou criar um novo.'}
        </Typography>
      </>
    ),
    setor: (
      <>
        <Typography variant="h6" color={theme.palette.info.main}>
          Oi, eu sou a Kaká! 📏
        </Typography>
        <Typography variant="body1" color={theme.palette.info.main}>
          Você ainda não criou nenhum setor.
          <br />
          Que tal começar sua <strong>árvore de setores</strong>?{' '}
          <Link
            component="button"
            onClick={onCreate}
            underline="always"
            color="primary"
            sx={{ fontWeight: 500 }}
          >
            Clique aqui!
          </Link>
        </Typography>
      </>
    ),
    documento: (
      <Typography variant="h6" color={theme.palette.info.main}>
        {isFiltering
          ? 'Nenhum documento encontrado.'
          : 'Ainda não há documentos registrados.'}
      </Typography>
    ),
    instrumentosProposta: (
      <Typography variant="h6" color={theme.palette.info.main}>
        Ops, parece que não tem nenhum instrumento registrado nessa proposta. Que tal adicionar um?
      </Typography>
    ),
    revisao: (
      <Typography variant="h6" color={theme.palette.info.main}>
        Tudo certo! Nenhuma revisão para aprovar.
      </Typography>
    ),
    instrumentosCliente: (
      <Typography variant="h6" color={theme.palette.info.main}>
        Ops, parece que não tem nenhum instrumento cadastrado nessa cliente. Que tal adicionar um?
      </Typography>
    ),
    os: (
      <>
        <Typography variant="h6" color={theme.palette.info.main}>
          Ainda não há ordens de serviço cadastradas.
        </Typography>
        <Typography variant="body1" color={theme.palette.info.main}>
          As ordens de serviço aparecerão aqui quando forem criadas.
        </Typography>
      </>
    ),
  };

  return (
    <Box
      width="100%"
      bgcolor={theme.palette.info.lighter}
      border={`solid 2px ${theme.palette.info.lighter}`}
      borderRadius={isFiltering || table ? 0 : 2}
      display="flex"
      alignItems="center"
      justifyContent="center"
      padding={isDashboard ? 2 : 4}
      gap={4}
      flexDirection={isMobile ? 'column' : 'row'}
    >
      <Box display="flex" alignItems="start" gap={2} flexDirection="column" maxWidth={400}>
        {messages[content]}
      </Box>

      
     {showKaka && <img
        src="/assets/images/M4-KOMETRO1.png"
        alt="Mascote"
        style={{
          maxWidth: isMobile ? '150px' : '200px',
          height: 'auto',
        }}
      />}
    </Box>
  );
}

export default EmptyYet;
