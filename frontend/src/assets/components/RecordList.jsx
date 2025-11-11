import { Box, Button, Card, CardContent, Tooltip } from '@mui/material'
import React, { useState } from 'react'
import useResponsive from '../../theme/hooks/useResponsive';
import CalibrationPanel from '../../clients/components/CalibrationPanel';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import useCalibrationsMutations from '../../clients/hooks/useCalibrationMutation';
import Form from '../../clients/components/Form';
import AddIcon from '@mui/icons-material/Add';
import Movimentations from './InstrumentMovimentations';
import useAuth from '../../auth/hooks/useAuth';
import { EXPORT_ACTION, NO_PERMISSION_ACTION } from '../../utils/messages';
import AssetInformation from '../../components/AssetInformation';


const recordList = [
  {
    value: "2",
    label: 'Calibração'
  },
  {
    value: "3",
    label: 'Checagem'
  }
]

const dataButton = {
  '2': 'Criar calibração',
  '3': 'Criar checagem',
  '4': 'Exportar movimentações',
}

const messageTooltip = {
  '2': NO_PERMISSION_ACTION,
  '3': NO_PERMISSION_ACTION,
  '4': EXPORT_ACTION,
}

const movimentacoes = '4'
const informacoes = '1'
const calibracoes = '2'
const checagem = '3'

function RecordList({asset, adminPreview = false}) {
  const isMobile = useResponsive('down', 'md');
  const [value, setValue] = useState(adminPreview ? '1' : '2');
  const {
    mutateDeleteCalibration,
    isDeletingCalibration,
    mutateCreation,
    isLoadingCreation,
    mutateEdit,
    isLoadingEdit,
    mutateAddCertificate,
    isLoadingAddCertificate,
    mutateDeleteCertificate,
    isLoadingDeleteCertificate,
    selectedCalibration,
    setSelectedCalibration,
    form,
    handleOpenForm,
    handleCloseForm,
    openForm, 
    openEdit,
    setOpenEdit,
    openCreateCertificate,
    setOpenCreateCertificate,
    formCreate,
    error,
    setError,
    formCertificate,
    exportMovements,
    debouncedSearch,
  } = useCalibrationsMutations(null, asset?.id, value === checagem)

  const { hasCreatePermission } = useAuth()

  const handleChange = (event, newValue) => {
    setValue(newValue);
    setSelectedCalibration({});
  };

  return (
    <TabContext value={value}>
      <Box 
        sx={{ 
        borderBottom: 1, 
        borderColor: 'divider', 
        flexDirection: isMobile? 'column' : 'row', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'start' : 'center',
        }}
      >
        <TabList onChange={handleChange}>
          {adminPreview && <Tab label="Informações" value={informacoes} />}
          <Tab label="Calibração" value={calibracoes} />
          <Tab label="Checagem" value={checagem} />
          <Tab label="Movimentações" value={movimentacoes} />
        </TabList>
        <Form
          isMobile={isMobile}
          open={openForm}
          handleClose={handleCloseForm}
          create
          mutate={mutateCreation}
          form={formCreate}
          isLoadingCreation={isLoadingCreation}
          error={error}
          setError={setError}
          formCertificate={formCertificate}
          checagem={value === checagem}
          criterios={asset?.criteriosAceitacao}
        />
        {value !== informacoes && <Tooltip placement="top-start" title={hasCreatePermission ? value === movimentacoes && messageTooltip[movimentacoes] : messageTooltip[value]}>
          <span>
            <Button 
              startIcon={<AddIcon />} 
              variant='contained'
              disabled={!hasCreatePermission && value !== movimentacoes}
              size='small' 
              onClick={value === movimentacoes ? exportMovements : handleOpenForm}
              sx={{ my: isMobile ? 1 : 0}}
              >
              {dataButton[value]}
            </Button>
          </span>
        </Tooltip>}
      </Box>
      {adminPreview && <TabPanel sx={{ p: adminPreview ? 2 : 0}} value={informacoes}>
        <AssetInformation isMobile={isMobile} instrument={asset} />
      </TabPanel>}
      {recordList?.map((record) => (
        <TabPanel key={record?.label} value={record?.value} sx={{p:0, pt: 2}}>
          <CalibrationPanel
            isMobile={isMobile}
            mutateDeleteCalibration={mutateDeleteCalibration}
            isDeletingCalibration={isDeletingCalibration}
            isLoadingCreation={isLoadingCreation}
            mutateEdit={mutateEdit}
            isLoadingEdit={isLoadingEdit}
            mutateAddCertificate={mutateAddCertificate}
            isLoadingAddCertificate={isLoadingAddCertificate}
            mutateDeleteCertificate={mutateDeleteCertificate}
            isLoadingDeleteCertificate={isLoadingDeleteCertificate}
            selectedCalibration={selectedCalibration}
            setSelectedCalibration={setSelectedCalibration}
            form={form}
            openEdit={openEdit}
            setOpenEdit={setOpenEdit}
            openCreateCertificate={openCreateCertificate}
            setOpenCreateCertificate={setOpenCreateCertificate}
            error={error}
            setError={setError}
            checagem={recordList?.find(record => record?.label?.toLowerCase() === "checagem").value === record?.value }
            debouncedSearch={debouncedSearch}
            assetId={asset?.id}
          />
        </TabPanel>
      ))}
      <TabPanel sx={{ p: 0}} value={movimentacoes}>
        <Movimentations isMobile={isMobile} asset={asset} movimentationsPosition={asset?.historicoPosicoes} movimentationsSector={asset?.historicoSetores} />
      </TabPanel>
    </TabContext>
  )
}

export default RecordList