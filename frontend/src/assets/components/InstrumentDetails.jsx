import { 
  Card, 
  CardContent, 
  Typography, 
  Chip, 
  Stack, 
  IconButton, 
  MenuItem, 
  Menu, 
  Grid,
  Box,
  ListItemIcon
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import React, { useState } from 'react'
import useAuth from '../../auth/hooks/useAuth';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import CreateInstrument from './CreateInstrument';
import { fDate } from '../../utils/formatTime';
import EmptyYet from '../../components/EmptyYet';
import { dateDistanceText, findDateStatusColor } from '../../utils/date';
import InstrumentPosition from './InstrumentPosition';
import LockIcon from '@mui/icons-material/Lock';
import { frequenceCriterion, tipoSinalMap, tipoServicoMap } from '../../utils/assets';


const posicaoMap = {
  U: { label: 'Em uso', color: 'success' },
  E: { label: 'Em estoque', color: 'info' },
  I: { label: 'Inativo', color: 'default' },
  F: { label: 'Fora de uso', color: 'warning' },
};

const pluralize = (quantidade, periodo) => {
  if (!quantidade || !periodo) return '';
  const pluralMap = {
    dia: 'dias',
    mes: 'meses',
    ano: 'anos',
  };
  return quantidade > 1 ? pluralMap[periodo] || periodo : periodo;
};

const OptionsMenu = ({ 
  mutateUpdateClient, 
  defaultAssets,
  selectedItem,
  asset,
  mutateDeleteClient,
  setSelectedItem,
  openFormCreateInstrument, 
  setOpenFormCreateInstrument,
  isFetching,
  setores, 
  error,
  handleCloseCreateInstrument,
  setError,
  search,
  setSearch,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  
  const open = Boolean(anchorEl);
  const { user, hasDeletePermission, hasEditPermission } = useAuth();
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <IconButton
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        >
        <MoreVertIcon />
      </IconButton>
      <Menu
        open={open}
        id="basic-menu"
        anchorEl={anchorEl}
        onClose={handleClose}
        slotProps={{
          list: {
            'aria-labelledby': 'basic-button',
          },
        }}
      >
        <MenuItem 
          disabled={!hasEditPermission} 
          onClick={() => setOpenFormCreateInstrument({status: true, type: 'edit'})}
        >
          {!hasEditPermission && <ListItemIcon><LockIcon fontSize='small' /></ListItemIcon>}
          Editar
        </MenuItem>
        <MenuItem 
          disabled={!hasDeletePermission} 
          onClick={() => setOpenFormCreateInstrument({status: true, type: 'delete'})}
        >
          {!hasDeletePermission && <ListItemIcon><LockIcon fontSize='small' /></ListItemIcon>}
          Excluir
        </MenuItem>
      </Menu>

      <ConfirmDeleteDialog
        open={openFormCreateInstrument?.type === 'delete' && openFormCreateInstrument?.status}
        onClose={() => setOpenFormCreateInstrument({status: false, type: 'delete'})}
        type="instrument"
        onConfirm={() => {mutateDeleteClient(asset?.id); setSelectedItem(null)}}
      />

      <CreateInstrument
        handleClose={() => handleCloseCreateInstrument("edit")}
        open={openFormCreateInstrument?.type === 'edit' && openFormCreateInstrument?.status}
        defaultAssets={defaultAssets}
        search={search}
        setSearch={setSearch}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        setor={selectedItem}
        cliente={user?.cliente}
        mutate={mutateUpdateClient}
        asset={asset}
        isFetching={isFetching}
        setores={setores}
        error={error}
        setError={setError}
      />
    </div>
  )
}


function InstrumentDetails({ 
  instrumento,   
  mutateUpdateClient,
  defaultAssets,
  search,
  setSearch,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  selectedItem,
  mutateDeleteClient,
  setSelectedItem,
  isFetching,
  setores,
  mutateChangePosition,
  error,
  setError,
  openFormCreateInstrument, 
  setOpenFormCreateInstrument,
  handleCloseCreateInstrument,
  mutateCreateClient
}) {
  const { user } = useAuth();
  if (!instrumento) {
    return (
      <>
        <EmptyYet
          content="instrumento"
          onCreate={() =>  setOpenFormCreateInstrument({status: true, type: 'create'})}
          imageAlt="Mascote da empresa"
        />
        <CreateInstrument
          handleClose={() => handleCloseCreateInstrument("create")}
          open={openFormCreateInstrument?.type === 'create' && openFormCreateInstrument?.status}
          defaultAssets={defaultAssets}
          search={search}
          setSearch={setSearch}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          setor={selectedItem}
          cliente={user?.cliente}
          mutate={mutateCreateClient}
          error={error}
          setError={setError}
        />
      </>
    )
  }
 
  const tipoDeInstrumento = instrumento?.instrumento?.tipoDeInstrumento;
  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" mb={2}>
            Informações instrumento
          </Typography>
          <Box display='flex' alignItems='center' gap={1}>
            {!!instrumento?.dataProximaCalibracao && (
              <Chip
              label={`Vence ${dateDistanceText(instrumento?.dataProximaCalibracao)}`}
              variant="filled"
              color={findDateStatusColor(instrumento?.dataProximaCalibracao)}
              sx={{ color: '#fff' }}
              />
            )}
            <InstrumentPosition mutateChangePosition={mutateChangePosition} positionMap={posicaoMap} instrumento={instrumento} />
            <OptionsMenu
              mutateUpdateClient={mutateUpdateClient} 
              defaultAssets={defaultAssets}
              selectedItem={selectedItem}
              asset={instrumento}
              mutateDeleteClient={mutateDeleteClient}
              setSelectedItem={setSelectedItem}
              openFormCreateInstrument={openFormCreateInstrument}
              setOpenFormCreateInstrument={setOpenFormCreateInstrument}
              isFetching={isFetching}
              setores={setores}
              error={error}
              setError={setError}
              search={search}
              setSearch={setSearch}
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              handleCloseCreateInstrument={handleCloseCreateInstrument}
            />
          </Box>
        </Stack>

        <Grid container spacing={2}>
          {(tipoDeInstrumento?.descricao || instrumento?.tag ||
            tipoDeInstrumento?.modelo || tipoDeInstrumento?.fabricante ||
            instrumento?.classe || instrumento?.numeroDeSerie ||
            instrumento?.instrumento?.procedimentoRelacionado?.codigo) && (
            <Grid item xs={12} sm={6} md={6}>
              {(tipoDeInstrumento?.descricao || instrumento?.tag) && (
                <Typography variant="subtitle2">
                  {tipoDeInstrumento?.descricao} | {instrumento?.tag}
                </Typography>
              )}
              {(tipoDeInstrumento?.modelo || tipoDeInstrumento?.fabricante) && (
                <Typography variant="body2">
                  {tipoDeInstrumento?.modelo} - {tipoDeInstrumento?.fabricante}
                </Typography>
              )}
              {!!instrumento?.classe && (
                <Typography variant="body2">Classe: {instrumento.classe}</Typography>
              )}
              {!!instrumento?.numeroDeSerie && (
                <Typography variant="body2">Número de Série: {instrumento.numeroDeSerie}</Typography>
              )}
              {!!instrumento?.instrumento?.procedimentoRelacionado?.codigo && (
                <Typography variant="body2">
                  Procedimento: {instrumento.instrumento.procedimentoRelacionado.codigo}
                </Typography>
              )}
            </Grid>
          )}

          {(instrumento?.observacaoStatus || instrumento?.dataProximaCalibracao || instrumento?.dataUltimaCalibracao || instrumento?.dataProximaChecagem || instrumento?.dataUltimaChecagem) && (
            <Grid item xs={12} sm={6} md={6}>
              <Typography variant="subtitle2" my={1}>Status</Typography>
              {!!instrumento?.observacaoStatus && (
                <Typography variant="body2">Observação: {instrumento.observacaoStatus}</Typography>
              )}
              {!!instrumento?.dataProximaCalibracao && (
                <Typography variant="body2">Próxima calibração: {fDate(instrumento?.dataProximaCalibracao)}</Typography>
              )}
              {!!instrumento?.dataUltimaCalibracao && (
                <Typography variant="body2">Data da última calibração: {fDate(instrumento?.dataUltimaCalibracao)}</Typography>
              )}
              {!!instrumento?.dataProximaChecagem && (
                <Typography variant="body2">Próxima checagem: {fDate(instrumento?.dataProximaChecagem)}</Typography>
              )}
              {!!instrumento?.dataUltimaChecagem && (
                <Typography variant="body2">Data da última checagem: {fDate(instrumento?.dataUltimaChecagem)}</Typography>
              )}
            </Grid>
          )}

          {(tipoDeInstrumento?.resolucao ||
            instrumento?.instrumento?.minimo ||
            instrumento?.instrumento?.maximo ||
            instrumento?.instrumento?.tipoSinal) && (
            <Grid item xs={12} sm={6} md={6}>
              <Typography variant="subtitle2" my={1}>Características metrológicas</Typography>
              {!!tipoDeInstrumento?.resolucao && (
                <Typography variant="body2">Resolução: {tipoDeInstrumento.resolucao}</Typography>
              )}
              {(instrumento?.instrumento?.minimo || instrumento?.instrumento?.maximo) && (
                <Typography variant="body2">
                  Faixa: {instrumento.instrumento.minimo} - {instrumento.instrumento.maximo} {instrumento.instrumento.unidade}
                </Typography>
              )}
              {!!instrumento?.instrumento?.tipoSinal && (
                <Typography variant="body2">
                  Tipo de sinal: {tipoSinalMap[instrumento?.instrumento?.tipoSinal] || 'Desconhecido'}
                </Typography>
              )}
            </Grid>
          )}

          {(instrumento?.frequenciaChecagem?.quantidade || instrumento?.frequenciaCalibracao?.quantidade) && (
            <Grid item xs={12} sm={6} md={6}>
              <Typography variant="subtitle2" my={1}>Frequência</Typography>
              <Typography variant="body2" my={1}>Critério de frequência: {instrumento?.criterioFrequencia ? frequenceCriterion[instrumento?.criterioFrequencia] : frequenceCriterion[instrumento?.cliente?.criterioFrequenciaPadrao]}</Typography>
              {!!instrumento?.frequenciaChecagem?.quantidade && (
                <Typography variant="body2">
                  Checagem: {instrumento.frequenciaChecagem.quantidade}{' '}
                  {pluralize(instrumento.frequenciaChecagem.quantidade, instrumento.frequenciaChecagem.periodo)}
                </Typography>
              )}
              {!!instrumento?.frequenciaCalibracao?.quantidade && (
                <Typography variant="body2">
                  Calibração: {instrumento.frequenciaCalibracao.quantidade}{' '}
                  {pluralize(instrumento.frequenciaCalibracao.quantidade, instrumento.frequenciaCalibracao.periodo)}
                </Typography>
              )}
            </Grid>
          )}

          {(!!instrumento?.criteriosAceitacao?.length) && (
            <Grid item xs={12} sm={6} md={6}>
              <Typography variant="subtitle2" my={1}>{instrumento?.criteriosAceitacao?.length > 1 ? 'Critérios de aceitação' : 'Critério de aceitação'}</Typography>
              {instrumento?.criteriosAceitacao?.map((criterio, i) => (
                <div key={`${criterio?.tipo} ${i}` }>
                  <Typography variant="body2" fontWeight={700}>{criterio?.tipo}</Typography>
                  {!!criterio?.criterioDeAceitacao && (
                    <Typography variant="body2">
                      Critério de aceitação: {criterio.criterioDeAceitacao} {criterio.unidade}
                    </Typography>
                  )}
                  {!!criterio?.referenciaDoCriterio && (
                    <Typography variant="body2">Memória de cálculo: {criterio.referenciaDoCriterio}</Typography>
                  )}
                  {!!criterio?.observacaoCriterioAceitacao && (
                    <Typography variant="body2">Observação: {criterio.observacaoCriterioAceitacao}</Typography>
                  )}
                </div>
              ))}
              {!!instrumento?.instrumento?.tipoDeServio && (
                <Typography variant="body2">
                  Tipo de serviço: {tipoServicoMap[instrumento.instrumento.tipoDeServio] || 'Desconhecido'}
                </Typography>
              )}
            </Grid>
          )}

         
          {!!instrumento?.pontosDeCalibracao?.length && (
            <Grid item xs={12} sm={6} md={6}>
              <Typography variant="subtitle2" my={1}>Pontos de Calibração</Typography>
              <Typography variant="body2">
                {instrumento.pontosDeCalibracao.map((ponto, index, arr) => {
                  const isLast = index === arr.length - 1;
                  return `${ponto?.nome}${isLast ? '.' : ', '}`;
                })}
              </Typography>
            </Grid>
          )}

          {!!instrumento?.normativos?.length && (
            <Grid item xs={12} sm={6} md={6}>
              <Typography variant="subtitle2" my={1}>Normativo/legal</Typography>
              <Typography variant="body2">
                {instrumento.normativos.map((norma, index, arr) => {
                  const isLast = index === arr.length - 1;
                  return `${norma?.nome}${isLast ? '.' : ', '}`;
                })}
              </Typography>
            </Grid>
          )}

          {!!instrumento?.observacao && (
            <Grid item xs={12} sm={6} md={6}>
              <Typography variant="subtitle2" my={1}>Observação</Typography>
              <Typography variant="body2">
                {instrumento?.observacao}
              </Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}

export default InstrumentDetails